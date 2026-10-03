import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, inArray } from 'drizzle-orm';

import { PaymentsService, schema } from '@/libs/shared';
import { type ParsedPaymentsCsv, parsePaymentsCsv, toBareCents, toCents } from './payments.parser';

export interface PaymentsImportSummary {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
}

const UPDATABLE_FIELDS = [
  'object_name',
  'amount_cents',
  'currency',
  'source',
  'purchased_at',
  'country_code',
  'customer_key',
  'donation',
  'on_sale',
  'product_price_cents',
  'tax_added_cents',
  'tip_cents',
  'marketplace_fee_cents',
  'source_fee_cents',
  'payout',
  'amount_delivered_cents',
  'source_id',
] as const;

@Injectable()
export class PaymentsImporterService {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  private customerKey(email: string | null): string | null {
    if (!email) return null;

    return createHmac('sha256', this.configService.getOrThrow<string>('API_JWT_SECRET'))
      .update(email.trim().toLowerCase())
      .digest('base64url');
  }

  async import(userId: string, csv: string): Promise<PaymentsImportSummary> {
    const { rows, malformed } = parsePaymentsCsv(csv);

    const valid = rows.filter((row) => row.externalId != null);
    const externalIds = [...new Set(valid.map((row) => row.externalId as string))];

    const existing = await this.paymentsService.findMany({
      where: and(
        eq(schema.paymentsTable.user_id, userId),
        externalIds.length > 0 ? inArray(schema.paymentsTable.external_id, externalIds) : undefined,
      ),
    });

    const existingById = new Map(existing.map((payment) => [payment.external_id, payment]));

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of valid) {
      const externalId = row.externalId as string;
      const payload = this.mapRow(userId, row);
      const current = existingById.get(externalId);

      if (!current) {
        await this.paymentsService.create(payload);
        imported += 1;
        continue;
      }

      const changes = this.diff(current, payload);

      if (changes) {
        await this.paymentsService.update(current.id, changes);
        updated += 1;
      } else {
        skipped += 1;
      }
    }

    return {
      total: valid.length,
      imported,
      updated,
      skipped: skipped + malformed,
    };
  }

  private diff(
    current: { [key: string]: unknown },
    payload: { [key: string]: unknown },
  ): Record<string, unknown> | null {
    const changes: Record<string, unknown> = {};

    for (const field of UPDATABLE_FIELDS) {
      const before = current[field];
      const after = payload[field];

      const unchanged =
        before instanceof Date && after instanceof Date
          ? before.getTime() === after.getTime()
          : (before ?? null) === (after ?? null);

      if (!unchanged) {
        changes[field] = after;
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  private mapRow(userId: string, row: ParsedPaymentsCsv['rows'][number]) {
    return {
      user_id: userId,
      external_id: row.externalId as string,
      object_name: row.values.object_name ?? null,
      amount_cents: row.amountCents,
      currency: row.values.currency ?? null,
      source: row.values.source ?? null,
      purchased_at: row.purchasedAt,
      country_code: row.values.country_code ?? null,
      customer_key: this.customerKey(row.values.email),
      donation: row.values.donation ?? null,
      on_sale: row.values.on_sale ?? null,
      product_price_cents: toBareCents(row.values.product_price),
      tax_added_cents: toCents(row.values.tax_added),
      tip_cents: toCents(row.values.tip),
      marketplace_fee_cents: toCents(row.values.marketplace_fee),
      source_fee_cents: toCents(row.values.source_fee),
      payout: row.values.payout ?? null,
      amount_delivered_cents: toCents(row.values.amount_delivered),
      source_id: row.values.source_id ?? null,
    };
  }
}
