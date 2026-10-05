import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CryptoModule } from '@/libs/auth';
import { ApiKeysModule, GamesModule, OAuthIdentitiesModule, PaymentsModule } from '@/libs/shared';
import { GamesImporterService } from './games/games-importer.service';
import { GamesSyncScheduler } from './games/games-sync.scheduler';
import { JWT_SECRET_KEY } from './itch.constants';
import { PaymentsImporterService } from './payments/payments-importer.service';

@Module({
  imports: [
    ApiKeysModule,
    CryptoModule,
    GamesModule,
    OAuthIdentitiesModule,
    PaymentsModule,
    HttpModule,
  ],
  providers: [
    {
      provide: JWT_SECRET_KEY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): string =>
        configService.getOrThrow<string>('API_JWT_SECRET'),
    },
    GamesImporterService,
    GamesSyncScheduler,
    PaymentsImporterService,
  ],
  exports: [GamesImporterService, PaymentsImporterService],
})
export class ItchModule {}
