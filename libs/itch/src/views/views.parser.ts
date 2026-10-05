export interface ParsedViewRow {
  gameId: string;
  date: string;
  count: number;
}

export interface ParsedViewsPayload {
  rows: ParsedViewRow[];
  malformed: number;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toDay = (value: unknown): string | null =>
  typeof value === 'string' && DATE_PATTERN.test(value) ? value : null;

const toCount = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;

const toGameId = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.length > 0) return value;
  return null;
};

export function parseViewsPayload(payload: unknown): ParsedViewsPayload {
  if (typeof payload !== 'object' || payload == null) {
    return { rows: [], malformed: 0 };
  }

  const days = (payload as { views?: unknown }).views;
  if (!Array.isArray(days)) {
    return { rows: [], malformed: 0 };
  }

  const rows: ParsedViewRow[] = [];
  let malformed = 0;

  for (const day of days) {
    if (typeof day !== 'object' || day == null) {
      malformed += 1;
      continue;
    }

    const date = toDay((day as Record<string, unknown>).date);
    const counts = (day as Record<string, unknown>).counts;

    if (!date || !Array.isArray(counts)) {
      malformed += 1;
      continue;
    }

    for (const entry of counts) {
      if (typeof entry !== 'object' || entry == null) {
        malformed += 1;
        continue;
      }

      const gameId = toGameId((entry as Record<string, unknown>).game_id);
      const count = toCount((entry as Record<string, unknown>).count);

      if (!gameId || count == null) {
        malformed += 1;
        continue;
      }

      rows.push({ gameId, date, count });
    }
  }

  return { rows, malformed };
}
