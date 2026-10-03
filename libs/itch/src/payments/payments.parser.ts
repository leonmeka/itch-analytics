export interface ParsedPaymentRow {
  externalId: string | null;
  createdAtCsv: string | null;
  purchasedAt: Date | null;
  amountCents: number | null;
  values: Record<string, string | null>;
}

export interface ParsedPaymentsCsv {
  header: string[];
  rows: ParsedPaymentRow[];
  malformed: number;
}

const CSV_FIELDS = [
  'object_name',
  'amount',
  'source',
  'created_at',
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
  'currency',
  'source_id',
  'billing_name',
  'billing_street_1',
  'billing_street_2',
  'billing_city',
  'billing_state',
  'billing_zip',
  'billing_country',
] as const;

export function splitCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];

    if (inQuotes) {
      if (char === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[i + 1] === '\n') i += 1;

      row.push(field);
      field = '';

      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }

  return rows;
}

export const toCents = (amount: string | null): number | null => {
  if (!amount) return null;

  const match = /-?\d+(\.\d+)?/.exec(amount.replace(',', ''));
  if (!match) return null;

  return Math.round(Number.parseFloat(match[0]) * 100);
};

export const toBareCents = (value: string | null): number | null => {
  if (!value) return null;

  const match = /\d+/.exec(value.replace(',', ''));

  return match ? Number.parseInt(match[0], 10) : null;
};

const toTimestamp = (value: string | null): Date | null => {
  if (!value) return null;

  const iso = value.trim().replace(' UTC', 'Z').replace(' ', 'T');
  const date = new Date(iso);

  return Number.isNaN(date.getTime()) ? null : date;
};

export function parsePaymentsCsv(csv: string): ParsedPaymentsCsv {
  const matrix = splitCsv(csv.replace(/^\uFEFF/, ''));
  const malformed = matrix.filter((row) => row.length < 2).length;

  if (matrix.length === 0) {
    return { header: [], rows: [], malformed };
  }

  const [header, ...dataRows] = matrix;
  const indexBy = new Map(header.map((name, index) => [name.trim(), index]));

  const value = (row: string[], name: (typeof CSV_FIELDS)[number]): string | null => {
    const index = indexBy.get(name);

    if (index == null) return null;

    const raw = row[index]?.trim() ?? '';

    return raw === '' ? null : raw;
  };

  const rows = dataRows.map((row): ParsedPaymentRow => {
    const createdAtCsv = value(row, 'created_at');

    return {
      externalId: row[indexBy.get('id') ?? -1]?.trim() || null,
      createdAtCsv,
      purchasedAt: toTimestamp(createdAtCsv),
      amountCents: toCents(value(row, 'amount')),
      values: Object.fromEntries(CSV_FIELDS.map((name) => [name, value(row, name)])),
    };
  });

  return { header, rows, malformed };
}
