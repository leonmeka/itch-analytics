import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from '@/libs/auth';
import { ItchModule } from '@/libs/itch';
import {
  DatabaseModule,
  OAuthIdentitiesModule,
  PaymentsModule,
  RefreshTokensModule,
  UsersModule,
} from '@/libs/shared';
import { PORT_KEY } from './config.constants';
import { AuthController } from './controllers/auth.controller';
import { HealthController } from './controllers/health.controller';
import { UsersController } from './controllers/users.controller';
import { env } from './env';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (values: Record<string, unknown>) => {
        try {
          return env.parse(values);
        } catch (error) {
          console.error('Invalid/missing environment variables');
          throw error;
        }
      },
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    OAuthIdentitiesModule,
    RefreshTokensModule,
    PaymentsModule,
    AuthModule,
    ItchModule,
  ],
  controllers: [HealthController, AuthController, UsersController],
  providers: [
    {
      provide: PORT_KEY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): number =>
        configService.getOrThrow<number>('API_PORT'),
    },
  ],
})
export class AppModule {}
