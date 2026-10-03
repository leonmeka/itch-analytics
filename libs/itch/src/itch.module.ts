import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { PaymentsModule } from '@/libs/shared';
import { ItchService } from './itch.service';
import { PaymentsImporterService } from './payments/payments-importer.service';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://api.itch.io',
      timeout: 5000,
    }),
    PaymentsModule,
  ],
  providers: [ItchService, PaymentsImporterService],
  exports: [ItchService, PaymentsImporterService],
})
export class ItchModule {}
