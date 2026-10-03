import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { schema } from '../db/db.inference';

export type Payment = InferSelectModel<typeof schema.paymentsTable>;
export type CreatePayment = InferInsertModel<typeof schema.paymentsTable>;
export type UpdatePayment = Partial<CreatePayment>;

export type PaymentWithRelations = Payment;

export type PaymentRevenueRow = { currency: string; amount_cents: number };

export type PaymentRevenueDayRow = { date: string; amount_cents: number };
