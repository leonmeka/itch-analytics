import { randomUUID } from 'node:crypto';
import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';
import type { UserDto } from '@scratch/protocol';
import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { AUTH_CONFIG_KEY, type AuthConfig, ItchAuthGuard } from '@/libs/auth';
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

  @Get('login')
  @UseGuards(ItchAuthGuard)
  login(): void {}

  @Post('token')
  @HttpCode(200)
  @UseGuards(ItchAuthGuard)
  async token(@Req() request: Request, @Res() response: Response): Promise<void> {
    const user = request.user as User;

    const access_token = await this.jwtService.signAsync({ sub: user.id, type: 'access' });

    const jti = randomUUID();
    const refresh_token = await this.jwtService.signAsync(
      { sub: user.id, jti, type: 'refresh' },
      { expiresIn: this.authConfig.refreshTokenExpiresIn },
    );
    const exp = this.jwtService.decode<{ exp: number }>(refresh_token).exp;
    await this.refreshTokensService.create({
      user_id: user.id,
      jti,
      expires_at: new Date(exp * 1000),
    });

    response.json({
      redirect_url: this.authConfig.oauthSuccessRedirectUrl,
      user: user as unknown as UserDto,
      access_token,
      refresh_token,
    });
  }

  @Get('me')
  async me(@Req() request: Request): Promise<UserDto | null> {
    const token = request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice('Bearer '.length)
      : null;

    if (!token) return null;

    let payload: { sub: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; type?: string }>(token);
    } catch {
      return null;
    }

    if (payload.type !== 'access') return null;

    return this.usersService.find({
      where: eq(schema.usersTable.id, payload.sub),
    });
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Body() body: { refresh_token?: string },
  ): Promise<
    | { refreshed: true; access_token: string; refresh_token: string; user: UserDto }
    | { refreshed: false }
  > {
    const refresh_token = body?.refresh_token;

    if (!refresh_token) {
      return { refreshed: false };
    }

    let payload: { sub: string; jti?: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync(refresh_token);
    } catch {
      return { refreshed: false };
    }

    if (payload.type !== 'refresh' || !payload.jti) {
      return { refreshed: false };
    }

    const stored = await this.refreshTokensService.find({
      where: eq(schema.refreshTokensTable.jti, payload.jti),
    });

    if (!stored) {
      return { refreshed: false };
    }

    const user = await this.usersService.find({
      where: eq(schema.usersTable.id, stored.user_id),
    });

    if (!user) {
      await this.refreshTokensService.deleteMany(
        eq(schema.refreshTokensTable.user_id, stored.user_id),
      );

      return { refreshed: false };
    }

    await this.refreshTokensService.delete(stored.id);

    const access_token = await this.jwtService.signAsync({ sub: user.id, type: 'access' });

    const jti = randomUUID();
    const next_refresh_token = await this.jwtService.signAsync(
      { sub: user.id, jti, type: 'refresh' },
      { expiresIn: this.authConfig.refreshTokenExpiresIn },
    );
    const exp = this.jwtService.decode<{ exp: number }>(next_refresh_token).exp;
    await this.refreshTokensService.create({
      user_id: user.id,
      jti,
      expires_at: new Date(exp * 1000),
    });

    return {
      refreshed: true,
      access_token,
      refresh_token: next_refresh_token,
      user: user as unknown as UserDto,
    };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: Request): Promise<void> {
    const token = request.headers.authorization?.startsWith('Bearer ')
      ? request.headers.authorization.slice('Bearer '.length)
      : null;

    if (!token) return;

    let payload: { sub?: string; type?: string };

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      return;
    }

    if (payload.type === 'access' && payload.sub) {
      await this.refreshTokensService.deleteMany(
        eq(schema.refreshTokensTable.user_id, payload.sub),
      );
    }
  }
}
