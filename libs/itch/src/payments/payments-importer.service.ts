import { createHmac } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { PaymentsService, schema } from '@/libs/shared';
import type { ImportSummary } from '../imports/import.types';
import { diffImportRow } from '../imports/import.utils';
import { JWT_SECRET_KEY } from '../itch.constants';
import { type ParsedPaymentRow, parsePaymentsCsv, toBareCents, toCents } from './payments.parser';

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
    @Inject(JWT_SECRET_KEY) private readonly jwtSecret: string,
    private readonly paymentsService: PaymentsService,
  ) {}

  private customerKey(email: string | null): string | null {
    if (!email) return null;

    return createHmac('sha256', this.jwtSecret)
      .update(email.trim().toLowerCase())
      .digest('base64url');
  }

  async import(userId: string, csv: string): Promise<ImportSummary> {
    const { rows, malformed } = parsePaymentsCsv(csv);

    const valid = [...new Map(rows.map((row) => [row.externalId, row])).values()];
    if (valid.length === 0) return { total: 0, imported: 0, updated: 0, skipped: malformed };
    const externalIds = [...new Set(valid.map((row) => row.externalId))];

    const existing = await this.paymentsService.findMany({
      where: and(
        eq(schema.paymentsTable.user_id, userId),
        inArray(schema.paymentsTable.external_id, externalIds),
      ),
    });

    const existingById = new Map(existing.map((payment) => [payment.external_id, payment]));

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of valid) {
      const externalId = row.externalId;
      const payload = this.mapRow(userId, row);
      const current = existingById.get(externalId);

      if (!current) {
        await this.paymentsService.create(payload);
        imported += 1;
        continue;
      }

      const changes = diffImportRow(current, payload, UPDATABLE_FIELDS);

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

  private mapRow(userId: string, row: ParsedPaymentRow) {
    return {
      user_id: userId,
      external_id: row.externalId,
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
