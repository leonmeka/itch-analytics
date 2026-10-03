import { Module } from '@nestjs/common';

import { DatabaseModule } from '../db/db.module';
import { PaymentsRepository } from '../repositories/payments.repository';
import { PaymentsService } from '../services/payments.service';

@Module({
  imports: [DatabaseModule],
  providers: [PaymentsService, PaymentsRepository],
  exports: [PaymentsService],
})
export class PaymentsModule {}
