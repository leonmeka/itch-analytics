import type { PaymentsFilterDto } from '@itch/protocol';
import { Injectable } from '@nestjs/common';

import { PaymentsRepository } from '../repositories/payments.repository';
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

  getPayments(userId: string, filters: PaymentsFilterDto, limit: number, offset: number) {
    return this.paymentsRepository.getPayments(userId, filters, limit, offset);
  }

  getSummary(userId: string, filters: PaymentsFilterDto) {
    return this.paymentsRepository.getSummary(userId, filters);
  }

  getGraph(userId: string, filters: PaymentsFilterDto) {
    return this.paymentsRepository.getGraph(userId, filters);
  }
}
