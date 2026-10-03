import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { JwtModule } from '@nestjs/jwt';
import { OAuthIdentitiesModule, UsersModule } from '@/libs/shared';

import { AUTH_CONFIG_KEY } from './auth.constants';
import type { AuthConfig } from './auth.types';
import { ItchAuthGuard } from './guards/itch.guard';
import { ItchOAuth2Strategy } from './strategies/itch.strategy';

@Module({
  imports: [
    OAuthIdentitiesModule,
    UsersModule,
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('API_JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>(
            'API_JWT_EXPIRES_IN',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [
    {
      provide: AUTH_CONFIG_KEY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): AuthConfig => ({
        jwtSecret: configService.getOrThrow<string>('API_JWT_SECRET'),
        jwtExpiresIn: configService.getOrThrow<string>(
          'API_JWT_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
        refreshTokenExpiresIn: configService.getOrThrow<string>(
          'API_REFRESH_TOKEN_EXPIRES_IN',
        ) as JwtSignOptions['expiresIn'],
        oauthSuccessRedirectUrl: configService.getOrThrow<string>(
          'API_OAUTH_AUTH_SUCCESS_REDIRECT_URL',
        ),
        itchClientID: configService.getOrThrow<string>('API_OAUTH_ITCH_CLIENT_ID'),
        itchCallbackURL: configService.getOrThrow<string>('API_OAUTH_ITCH_CALLBACK_URL'),
        itchScope: ['profile:me'],
        itchAuthorizationURL: 'https://itch.io/user/oauth',
        itchUserinfoURL: 'https://api.itch.io/profile',
      }),
    },
    ItchOAuth2Strategy,
    ItchAuthGuard,
  ],
  exports: [AUTH_CONFIG_KEY, JwtModule, ItchOAuth2Strategy],
})
export class AuthModule {}
