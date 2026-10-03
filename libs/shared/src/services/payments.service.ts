import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { schema } from '../db/db.inference';
import { PaymentRevenueRow, PaymentsRepository } from '../repositories/payments.repository';
import type { CreatePayment, Payment, UpdatePayment } from '../types/payments.types';
import { BaseService } from './base.service';

@Injectable()
export class PaymentsService extends BaseService<
  Payment,
  CreatePayment,
  UpdatePayment,
  Payment,
  'paymentsTable'
> {
  constructor(protected readonly paymentsRepository: PaymentsRepository) {
    super(paymentsRepository);
  }
  
  async getRevenueByCurrency(userId: string): Promise<PaymentRevenueRow[]> {
    return this.paymentsRepository.getRevenueByCurrency(userId);
  }
}
