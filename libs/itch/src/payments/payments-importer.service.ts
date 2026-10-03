import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';

import { PaymentsService, schema } from '@/libs/shared';
import { type ParsedPaymentsCsv, parsePaymentsCsv } from './payments.parser';

export interface PaymentsImportSummary {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
}

const UPDATABLE_FIELDS = [
  'object_name',
  'amount',
  'amount_cents',
  'currency',
  'source',
  'created_at_csv',
  'purchased_at',
  'email',
  'full_name',
  'donation',
  'on_sale',
  'country_code',
  'ip',
  'product_price',
  'tax_added',
  'tip',
  'marketplace_fee',
  'source_fee',
  'payout',
  'amount_delivered',
  'source_id',
  'billing_name',
  'billing_street_1',
  'billing_street_2',
  'billing_city',
  'billing_state',
  'billing_zip',
  'billing_country',
] as const;

@Injectable()
export class PaymentsImporterService {
  constructor(private readonly paymentsService: PaymentsService) {}

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
      amount: row.values.amount ?? null,
      amount_cents: row.amountCents,
      currency: row.values.currency ?? null,
      source: row.values.source ?? null,
      created_at_csv: row.createdAtCsv,
      purchased_at: row.purchasedAt,
      email: row.values.email ?? null,
      full_name: row.values.full_name ?? null,
      donation: row.values.donation ?? null,
      on_sale: row.values.on_sale ?? null,
      country_code: row.values.country_code ?? null,
      ip: row.values.ip ?? null,
      product_price: row.values.product_price ?? null,
      tax_added: row.values.tax_added ?? null,
      tip: row.values.tip ?? null,
      marketplace_fee: row.values.marketplace_fee ?? null,
      source_fee: row.values.source_fee ?? null,
      payout: row.values.payout ?? null,
      amount_delivered: row.values.amount_delivered ?? null,
      source_id: row.values.source_id ?? null,
      billing_name: row.values.billing_name ?? null,
      billing_street_1: row.values.billing_street_1 ?? null,
      billing_street_2: row.values.billing_street_2 ?? null,
      billing_city: row.values.billing_city ?? null,
      billing_state: row.values.billing_state ?? null,
      billing_zip: row.values.billing_zip ?? null,
      billing_country: row.values.billing_country ?? null,
    };
  }
}
