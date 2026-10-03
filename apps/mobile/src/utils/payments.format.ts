import type { PaymentDto } from '@itch/protocol';

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
export function paymentAmount(payment: PaymentDto): string {
  return payment.amount_cents != null ? formatMoney(payment.amount_cents) : 'Amount unavailable';
}
export function formatDate(value: Date | string | null, full = false): string {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  return date.toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(full ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}
export function paymentSource(source: string | null): string {
  if (!source) return 'Payment';
  return source === 'paypal'
    ? 'PayPal'
    : source === 'stripe'
      ? 'Stripe'
      : source[0].toUpperCase() + source.slice(1);
}
