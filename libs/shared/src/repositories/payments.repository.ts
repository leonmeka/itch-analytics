import { Inject, Injectable } from '@nestjs/common';
import type {
  PaymentCountryDto,
  PaymentGraphPointDto,
  PaymentSourceDto,
  PaymentsFilterDto,
  PaymentsGraphsDto,
  PaymentsSummaryDto,
} from '@scratch/protocol';
import { sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DATABASE_KEY } from '../db/db.constants';
import { schema, TSchema } from '../db/db.inference';
import type { Payment } from '../types/payments.types';
import { BaseRepository } from './base.repository';

@Injectable()
export class PaymentsRepository extends BaseRepository<
  TSchema,
  typeof schema.paymentsTable,
  'paymentsTable'
> {
  constructor(@Inject(DATABASE_KEY) database: NodePgDatabase<TSchema>) {
    super(database, schema.paymentsTable, 'paymentsTable');
  }

  async getPayments(
    userId: string,
    filters: PaymentsFilterDto,
    limit: number,
    offset: number,
  ): Promise<Payment[]> {
    const result = await this.database.execute<Payment & Record<string, unknown>>(sql`
      SELECT *
      FROM ${this.table}
      WHERE user_id = ${userId}
        AND (${filters.search?.trim() || null}::text IS NULL OR object_name ILIKE '%' || ${filters.search?.trim() || null}::text || '%' OR external_id ILIKE '%' || ${filters.search?.trim() || null}::text || '%')
      ORDER BY purchased_at DESC, external_id DESC, id DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    return result.rows;
  }

  async getSummary(userId: string, filters: PaymentsFilterDto): Promise<PaymentsSummaryDto> {
    const where = sql`
      user_id = ${userId}
      AND (${filters.search?.trim() || null}::text IS NULL OR object_name ILIKE '%' || ${filters.search?.trim() || null}::text || '%' OR external_id ILIKE '%' || ${filters.search?.trim() || null}::text || '%')
    `;
    const [total, money, sources, countries] = await Promise.all([
      this.database.execute<{ count: number; customers: number } & Record<string, unknown>>(sql`
        SELECT count(*)::int AS count,
               count(DISTINCT customer_key)::int AS customers
        FROM ${this.table}
        WHERE ${where}
      `),
      this.database.execute<
        { revenue_cents: number; tip_cents: number } & Record<string, unknown>
      >(sql`
        SELECT coalesce(sum(amount_cents), 0)::double precision AS revenue_cents,
               coalesce(sum(tip_cents), 0)::double precision AS tip_cents
        FROM ${this.table}
        WHERE ${where} AND amount_cents IS NOT NULL
      `),
      this.database.execute<PaymentSourceDto & Record<string, unknown>>(sql`
        SELECT coalesce(nullif(source, ''), 'unknown') AS source,
               sum(amount_cents)::double precision AS amount_cents
        FROM ${this.table}
        WHERE ${where} AND amount_cents IS NOT NULL
        GROUP BY coalesce(nullif(source, ''), 'unknown')
        ORDER BY amount_cents DESC
      `),
      this.database.execute<PaymentCountryDto & Record<string, unknown>>(sql`
        SELECT coalesce(nullif(country_code, ''), 'unknown') AS country_code,
               count(*)::int AS payments,
               coalesce(sum(amount_cents), 0)::double precision AS revenue_cents
        FROM ${this.table}
        WHERE ${where}
        GROUP BY coalesce(nullif(country_code, ''), 'unknown')
        ORDER BY payments DESC
      `),
    ]);
    return {
      total: total.rows[0].count,
      customers: total.rows[0].customers,
      revenue_cents: money.rows[0].revenue_cents,
      tip_cents: money.rows[0].tip_cents,
      sources: sources.rows,
      countries: countries.rows,
    };
  }

  async getGraph(userId: string, filters: PaymentsFilterDto): Promise<PaymentsGraphsDto> {
    const search = filters.search?.trim() || null;
    const where = sql`
      user_id = ${userId}
      AND (${search}::text IS NULL OR object_name ILIKE '%' || ${search}::text || '%' OR external_id ILIKE '%' || ${search}::text || '%')
    `;

    const [revenue, payments, customers, average, tips] = await Promise.all([
      this.database.execute<PaymentGraphPointDto & Record<string, unknown>>(sql`
        SELECT to_char(purchased_at::date, 'YYYY-MM-DD') AS date,
               (sum(sum(amount_cents)) OVER (ORDER BY purchased_at::date))::double precision AS value
        FROM ${this.table}
        WHERE ${where} AND amount_cents IS NOT NULL AND purchased_at IS NOT NULL
        GROUP BY purchased_at::date
        ORDER BY purchased_at::date
      `),
      this.database.execute<PaymentGraphPointDto & Record<string, unknown>>(sql`
        SELECT to_char(purchased_at::date, 'YYYY-MM-DD') AS date,
               (sum(count(*)) OVER (ORDER BY purchased_at::date))::double precision AS value
        FROM ${this.table}
        WHERE ${where} AND purchased_at IS NOT NULL
        GROUP BY purchased_at::date
        ORDER BY purchased_at::date
      `),
      this.database.execute<PaymentGraphPointDto & Record<string, unknown>>(sql`
        WITH first_purchase AS (
          SELECT customer_key, min(purchased_at)::date AS day
          FROM ${this.table}
          WHERE ${where} AND customer_key IS NOT NULL AND purchased_at IS NOT NULL
          GROUP BY customer_key
        )
        SELECT to_char(day, 'YYYY-MM-DD') AS date,
               (sum(count(*)) OVER (ORDER BY day))::double precision AS value
        FROM first_purchase
        GROUP BY day
        ORDER BY day
      `),
      this.database.execute<PaymentGraphPointDto & Record<string, unknown>>(sql`
        WITH daily AS (
          SELECT purchased_at::date AS day,
                 sum(amount_cents) AS revenue,
                 count(*) AS n
          FROM ${this.table}
          WHERE ${where} AND amount_cents IS NOT NULL AND purchased_at IS NOT NULL
          GROUP BY purchased_at::date
        )
        SELECT to_char(day, 'YYYY-MM-DD') AS date,
               (sum(revenue) OVER (ORDER BY day) / sum(n) OVER (ORDER BY day))::double precision AS value
        FROM daily
        ORDER BY day
      `),
      this.database.execute<PaymentGraphPointDto & Record<string, unknown>>(sql`
        SELECT to_char(purchased_at::date, 'YYYY-MM-DD') AS date,
               (sum(sum(tip_cents)) OVER (ORDER BY purchased_at::date))::double precision AS value
        FROM ${this.table}
        WHERE ${where} AND tip_cents IS NOT NULL AND purchased_at IS NOT NULL
        GROUP BY purchased_at::date
        ORDER BY purchased_at::date
      `),
    ]);

    return {
      revenue: revenue.rows,
      payments: payments.rows,
      customers: customers.rows,
      average: average.rows,
      tips: tips.rows,
    };
  }
}
