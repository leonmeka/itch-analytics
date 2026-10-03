import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DATABASE_KEY } from '../db/db.constants';
import { schema, TSchema } from '../db/db.inference';
import { BaseRepository } from './base.repository';

export interface PaymentRevenueRow {
  currency: string;
  amount_cents: number;
}

@Injectable()
export class PaymentsRepository extends BaseRepository<
  TSchema,
  typeof schema.paymentsTable,
  'paymentsTable'
> {
  constructor(@Inject(DATABASE_KEY) database: NodePgDatabase<TSchema>) {
    super(database, schema.paymentsTable, 'paymentsTable');
  }

  /** Gross revenue grouped per currency (sum of amount_cents). */
  async getRevenueByCurrency(userId: string): Promise<PaymentRevenueRow[]> {
    return this.database
      .select({
        currency: sql<string>`coalesce(${schema.paymentsTable.currency}, 'USD')`,
        amount_cents: sql<number>`coalesce(sum(${schema.paymentsTable.amount_cents}), 0)::int`,
      })
      .from(schema.paymentsTable)
      .where(eq(schema.paymentsTable.user_id, userId))
      .groupBy(schema.paymentsTable.currency);
  }
}
