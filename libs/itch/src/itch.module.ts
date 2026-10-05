import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { GamesModule, PaymentsModule, ViewsModule } from '@/libs/shared';
import { GamesImporterService } from './games/games-importer.service';
import { JWT_SECRET_KEY } from './itch.constants';
import { PaymentsImporterService } from './payments/payments-importer.service';
import { ViewsImporterService } from './views/views-importer.service';

@Module({
  imports: [GamesModule, PaymentsModule, ViewsModule],
  providers: [
    {
      provide: JWT_SECRET_KEY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): string =>
        configService.getOrThrow<string>('API_JWT_SECRET'),
    },
    GamesImporterService,
    PaymentsImporterService,
    ViewsImporterService,
  ],
  exports: [GamesImporterService, PaymentsImporterService, ViewsImporterService],
})
export class ItchModule {}
