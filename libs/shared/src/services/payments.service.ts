import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { schema } from '../db/db.inference';
import { PaymentsRepository } from '../repositories/payments.repository';
import type {
  CreatePayment,
  Payment,
  PaymentRevenueDayRow,
  PaymentRevenueRow,
  UpdatePayment,
} from '../types/payments.types';
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

  /** Headline aggregate: total payments + gross revenue per currency. */
  async getSummary(userId: string): Promise<{
    total: number;
    revenue: PaymentRevenueRow[];
  }> {
    const [total, revenue] = await Promise.all([
      this.count(eq(schema.paymentsTable.user_id, userId)),
      this.paymentsRepository.getRevenueByCurrency(userId),
    ]);

    return { total, revenue };
  }

  /** All-time cumulative revenue per day (running total, cents). */
  async getRevenueSeries(userId: string): Promise<PaymentRevenueDayRow[]> {
    return this.paymentsRepository.getRevenueSeries(userId);
  }
}
