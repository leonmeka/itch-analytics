import { randomUUID } from 'node:crypto';
import type { UserDto } from '@itch/protocol';
import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_CONFIG_KEY,
  type AuthConfig,
  ItchAuthGuard,
  REFRESH_TOKEN_COOKIE,
} from '@/libs/auth';
import { RefreshTokensService, schema, type User, UsersService } from '@/libs/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_CONFIG_KEY)
    private readonly authConfig: AuthConfig,
    private readonly jwtService: JwtService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Validates the refresh cookie, rotates the token pair and sets the new
   * auth cookies. Returns the user on success; throws 401 on a present but
   * invalid token (no-op `null` when the cookie is absent).
   */
  private async rotateTokenPair(response: Response, refresh_token?: string): Promise<User | null> {
    if (!refresh_token) {
      return null;
    }

    let payload: { sub: string; jti?: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync(refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.refreshTokensService.find({
      where: eq(schema.refreshTokensTable.jti, payload.jti),
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.find({
      where: eq(schema.usersTable.id, stored.user_id),
    });

    if (!user) {
      await this.refreshTokensService.deleteMany(
        eq(schema.refreshTokensTable.user_id, stored.user_id),
      );
      throw new UnauthorizedException('User no longer exists');
    }

    const access_token = await this.jwtService.signAsync({ sub: user.id, type: 'access' });
    const access_max_age =
      this.jwtService.decode<{ exp: number }>(access_token).exp * 1000 - Date.now();

    const jti = randomUUID();

    const next_refresh_token = await this.jwtService.signAsync(
      { sub: user.id, jti, type: 'refresh' },
      { expiresIn: this.authConfig.refreshTokenExpiresIn },
    );
    const next_exp = this.jwtService.decode<{ exp: number }>(next_refresh_token).exp * 1000;
    const next_max_age = next_exp - Date.now();

    await Promise.all([
      this.refreshTokensService.delete(stored.id),
      this.refreshTokensService.create({
        user_id: user.id,
        jti,
        expires_at: new Date(next_exp),
      }),
    ]);

    this.setAuthCookies(response, access_token, access_max_age, next_refresh_token, next_max_age);

    return user;
  }

  private setAuthCookies(
    response: Response,
    access_token: string,
    access_max_age: number,
    refresh_token: string,
    refresh_max_age: number,
  ): void {
    response.cookie(ACCESS_TOKEN_COOKIE, access_token, {
      ...this.authConfig.cookie,
      maxAge: access_max_age,
    });
    response.cookie(REFRESH_TOKEN_COOKIE, refresh_token, {
      ...this.authConfig.cookie,
      maxAge: refresh_max_age,
    });
  }

  /**
   * Session probe: returns the current user or null. A valid refresh token
   * re-authenticates transparently, so the client never sees a 401 during a
   * normal session probe.
   */
  @Get('me')
  async me(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = request.cookies?.[ACCESS_TOKEN_COOKIE] ?? null;

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub: string; type?: string }>(token);

        if (payload.type === 'access') {
          const user = await this.usersService.find({
            where: eq(schema.usersTable.id, payload.sub),
          });

          if (user) {
            return user;
          }
        }
      } catch {}
    }

    try {
      return await this.rotateTokenPair(response, request.cookies?.[REFRESH_TOKEN_COOKIE]);
    } catch {
      return null;
    }
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserDto | { refreshed: false }> {
    const refresh_token = request.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!refresh_token) {
      // Signed-out caller: a no-op 200 instead of 401 keeps client consoles
      // clean. Nothing is rotated without a cookie.
      return { refreshed: false };
    }

    return (await this.rotateTokenPair(response, refresh_token)) ?? { refreshed: false };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refresh_token = request.cookies?.[REFRESH_TOKEN_COOKIE];

    if (refresh_token) {
      let payload: { sub?: string; jti?: string; type?: string };
      try {
        payload = await this.jwtService.verifyAsync(refresh_token);
      } catch {
        payload = {};
      }

      if (payload.type === 'refresh' && payload.jti) {
        await this.refreshTokensService.deleteMany(
          eq(schema.refreshTokensTable.user_id, payload.sub ?? ''),
        );
      }
    }

    response.clearCookie(ACCESS_TOKEN_COOKIE, this.authConfig.cookie);
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.authConfig.cookie);
  }

  /** Starts the OAuth flow; the itch strategy handles the entire redirect. */
  @Get('login')
  @UseGuards(ItchAuthGuard)
  login(): void {}

  /**
   * Completes the OAuth flow; the strategy verifies state, resolves the
   * profile and provisions the user, then we set the auth cookies.
   */
  @Post('token')
  @HttpCode(200)
  @UseGuards(ItchAuthGuard)
  async token(@Req() request: Request, @Res() response: Response): Promise<void> {
    const user = request.user as User;

    const access_token = await this.jwtService.signAsync({ sub: user.id, type: 'access' });
    const access_max_age =
      this.jwtService.decode<{ exp: number }>(access_token).exp * 1000 - Date.now();

    const jti = randomUUID();

    const refresh_token = await this.jwtService.signAsync(
      { sub: user.id, jti, type: 'refresh' },
      { expiresIn: this.authConfig.refreshTokenExpiresIn },
    );

    const refresh_exp = this.jwtService.decode<{ exp: number }>(refresh_token).exp * 1000;
    const refresh_max_age = refresh_exp - Date.now();

    await this.refreshTokensService.create({
      user_id: user.id,
      jti,
      expires_at: new Date(refresh_exp),
    });

    this.setAuthCookies(response, access_token, access_max_age, refresh_token, refresh_max_age);

    response.json({
      redirect_url: this.authConfig.oauthSuccessRedirectUrl,
      user: user as unknown as UserDto,
    });
  }
}
