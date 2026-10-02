import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Request } from 'express';
import { Strategy as AbstractStrategy } from 'passport-strategy';
import { firstValueFrom } from 'rxjs';
import { OAuthIdentitiesService, OAuthProvider, schema, User, UsersService } from '@/libs/shared';

import { AUTH_CONFIG_KEY } from '../auth.constants';
import type { AuthConfig } from '../auth.types';

const OAUTH_STATE_TTL_MS = 10 * 60_000;

/**
 * itch.io does not support the authorization-code flow for third-party apps;
 * its "OAuth" is the implicit flow ("response_type=token"): after approval,
 * itch.io redirects to the registered Authorization Callback URL with the
 * access token — and the state passed at login — in the URL hash part.
 *
 * The strategy owns the entire itch.io auth logic:
 *
 * 1. `GET /auth/login` → 302 redirect to itch.io (`client_id`, `scope`,
 *    `redirect_uri`, `response_type=token`, signed `state`).
 * 2. `GET /auth/callback` → serves the callback page registered at itch.io;
 *    it forwards the hash contents to the app, which posts `access_token` +
 *    `state` back to the API.
 * 3. `POST /auth/token` → verifies the state, resolves the profile via
 *    `https://api.itch.io/profile`, provisions the user + oauth identity.
 */
@Injectable()
export class ItchOAuth2Strategy extends PassportStrategy(AbstractStrategy, OAuthProvider.Itch) {

  private readonly jwtSecret: string;
  private readonly itchClientID: string;
  private readonly itchCallbackURL: string;
  private readonly itchScope: string[];
  private readonly itchAuthorizationURL: string;
  private readonly itchUserinfoURL: string;

  constructor(
    @Inject(AUTH_CONFIG_KEY)
    private readonly authConfig: AuthConfig,
    private readonly oauthIdentitiesService: OAuthIdentitiesService,
    private readonly usersService: UsersService,
    private readonly httpService: HttpService,
  ) {
    super();

    this.jwtSecret = authConfig.jwtSecret;
    this.itchClientID = authConfig.itchClientID;
    this.itchCallbackURL = authConfig.itchCallbackURL;
    this.itchScope = authConfig.itchScope;
    this.itchAuthorizationURL = authConfig.itchAuthorizationURL;
    this.itchUserinfoURL = authConfig.itchUserinfoURL;
  }

  authenticate(request: Request): void {
    if (request.method === 'GET') {
      this.beginStep();
      return;
    }

    this.completeStep(request);
  }

  /** Login step: issue a signed state param and redirect to itch.io. */
  private beginStep(): void {
    const state = this.createState();
    const url = new URL(this.itchAuthorizationURL);

    url.searchParams.set('client_id', this.itchClientID);
    url.searchParams.set('scope', this.itchScope.join(' '));
    url.searchParams.set('redirect_uri', this.itchCallbackURL);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('state', state);

    this.redirect(url.toString());
  }

  /** Token step: the app posted the callback page's params; provision. */
  private async completeStep(request: Request): Promise<void> {
    try {
      const { access_token, state } = (request.body ?? {}) as {
        access_token?: string;
        state?: string;
      };

      if (!access_token) {
        this.fail({ message: 'Missing access token' }, 401);
        return;
      }

      if (!this.verifyState(state)) {
        this.fail({ message: 'Invalid OAuth state' }, 401);
        return;
      }

      const user = await this.loadUser(access_token);

      this.success(user);
    } catch (error) {
      this.error(error instanceof Error ? error : new Error('OAuth token step failed'));
    }
  }

  async loadProfile(accessToken: string): Promise<Record<string, unknown>> {
    const { data } = await firstValueFrom(
      this.httpService.get<Record<string, unknown>>(this.itchUserinfoURL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }),
    );

    return data;
  }

  /** Provisions (or links) the user + itch oauth identity. */
  async createUser(raw: Record<string, unknown>): Promise<User> {
    const rawUser = (raw.user as Record<string, unknown>) ?? raw;

    const providerUserId = String(rawUser.id ?? rawUser.uid ?? '');

    if (!providerUserId) {
      throw new Error('itch.io profile is missing an id');
    }

    const username = typeof rawUser.username === 'string' ? rawUser.username : undefined;
    const displayName = typeof rawUser.display_name === 'string' ? rawUser.display_name : undefined;
    const urlName = typeof rawUser.url_name === 'string' ? rawUser.url_name : undefined;
    const avatarUrl =
      typeof rawUser.avatar_url === 'string' && rawUser.avatar_url ? rawUser.avatar_url : undefined;

    const existing = await this.oauthIdentitiesService.find({
      where: and(
        eq(schema.oauthIdentitiesTable.provider, OAuthProvider.Itch),
        eq(schema.oauthIdentitiesTable.provider_user_id, providerUserId),
      ),
    });

    if (existing) {
      const user = await this.usersService.find({
        where: eq(schema.usersTable.id, existing.user_id),
      });

      if (!user) {
        throw new Error('OAuth identity exists but linked user was not found');
      }

      return user;
    }

    const user = await this.usersService.create({});

    await this.oauthIdentitiesService.create({
      user_id: user.id,
      provider: OAuthProvider.Itch,
      provider_user_id: providerUserId,
      name: displayName || username || urlName,
      avatar_url: avatarUrl,
    });

    return user;
  }

  async loadUser(accessToken: string): Promise<User> {
    const profile = await this.loadProfile(accessToken);

    return this.createUser(profile);
  }

  /** itch.io returns the state in the hash; verify signature + expiry. */
  private verifyState(state?: string): boolean {
    if (!state) return false;

    const parts = state.split('.');
    if (parts.length !== 3) return false;

    const [nonce, expiresRaw, mac] = parts;
    const expires = Number(expiresRaw);
    if (!nonce || !Number.isFinite(expires) || expires <= Date.now()) return false;

    const expected = this.sign(`${nonce}.${expiresRaw}`);
    const provided = Buffer.from(mac);
    const expectedBuffer = Buffer.from(expected);

    if (provided.length !== expectedBuffer.length) return false;

    return timingSafeEqual(provided, expectedBuffer);
  }

  private createState(): string {
    const nonce = randomBytes(16).toString('base64url');
    const expires = Date.now() + OAUTH_STATE_TTL_MS;
    const payload = `${nonce}.${expires}`;
    return `${payload}.${this.sign(payload)}`;
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.jwtSecret).update(payload).digest('base64url');
  }
}
