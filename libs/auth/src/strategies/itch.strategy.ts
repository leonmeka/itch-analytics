import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
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
 * The strategy owns the itch.io flow, following the passport provider
 * pattern: `authenticate()` performs the transport (redirect to itch.io, or
 * consume the token the app posts back), and the app-specific provisioning
 * lives in the passport `validate()` hook.
 */
@Injectable()
export class ItchOAuth2Strategy extends PassportStrategy(AbstractStrategy, OAuthProvider.Itch) {
  constructor(
    @Inject(AUTH_CONFIG_KEY)
    private readonly authConfig: AuthConfig,
    private readonly oauthIdentitiesService: OAuthIdentitiesService,
    private readonly usersService: UsersService,
    private readonly httpService: HttpService,
  ) {
    super();
  }

  authenticate(request: Request): void {
    if (request.method === 'GET') {
      this.begin(request);
      return;
    }

    this.complete(request);
  }

  /**
   * App-specific provisioning, mirroring the standard OAuth2 strategy's
   * `validate(accessToken, refreshToken, profile)` contract.
   */
  async validate(
    accessToken: string,
    _refreshToken: string | undefined,
    profile: Record<string, unknown>,
  ): Promise<User> {
    const rawUser: Record<string, unknown> = (profile.user as Record<string, unknown>) ?? profile;

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

  /** Login step: issue a signed state param and redirect to itch.io. */
  private begin(_request: Request): void {
    const state = this.createState();
    const config = this.authConfig;
    const url = new URL(config.itchAuthorizationURL);

    url.searchParams.set('client_id', config.itchClientID);
    url.searchParams.set('scope', config.itchScope.join(' '));
    url.searchParams.set('redirect_uri', config.itchCallbackURL);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('state', state);

    this.redirect(url.toString());
  }

  /** Token step: the app posted the callback page's params; provision. */
  private async complete(request: Request): Promise<void> {
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

      const profile = await this.loadProfile(access_token);
      const user = await this.validate(access_token, undefined, profile);

      this.success(user);
    } catch (error) {
      this.error(error instanceof Error ? error : new Error('OAuth token step failed'));
    }
  }

  async loadProfile(accessToken: string): Promise<Record<string, unknown>> {
    const { data } = await firstValueFrom(
      this.httpService.get<Record<string, unknown>>(this.authConfig.itchUserinfoURL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      }),
    );

    return data;
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
    return createHmac('sha256', this.authConfig.jwtSecret).update(payload).digest('base64url');
  }
}
