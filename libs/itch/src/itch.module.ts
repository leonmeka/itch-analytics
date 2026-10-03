import { Module } from '@nestjs/common';

import { PaymentsModule } from '@/libs/shared';
import { PaymentsImporterService } from './payments/payments-importer.service';

@Module({
  imports: [PaymentsModule],
  providers: [PaymentsImporterService],
  exports: [PaymentsImporterService],
})
export class ItchModule {}
