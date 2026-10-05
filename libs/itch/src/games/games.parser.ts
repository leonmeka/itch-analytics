import type { CreateGame } from '@/libs/shared';
import type { ParsedImport } from '../imports/import.types';

export type ParsedGameRow = Omit<CreateGame, 'user_id'>;

type ItchGame = {
  id: number | string;
  url?: unknown;
  title?: unknown;
  short_text?: unknown;
  cover_url?: unknown;
  classification?: unknown;
  type?: unknown;
  published?: unknown;
  published_at?: unknown;
  created_at?: unknown;
  min_price?: unknown;
  views_count?: unknown;
  downloads_count?: unknown;
  purchases_count?: unknown;
  traits?: unknown;
};

const str = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;
const strOrEmpty = (value: unknown): string => str(value) ?? '';
const date = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};
const num = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

function normalizeGame(game: ItchGame): ParsedGameRow {
  const traits = Array.isArray(game.traits)
    ? game.traits.filter((trait): trait is string => typeof trait === 'string')
    : null;

  return {
    external_id: String(game.id),
    url: strOrEmpty(game.url),
    title: strOrEmpty(game.title),
    short_text: str(game.short_text),
    cover_url: str(game.cover_url),
    classification: str(game.classification),
    type: str(game.type),
    published: typeof game.published === 'boolean' ? game.published : false,
    published_at: date(game.published_at),
    external_created_at: date(game.created_at),
    min_price: num(game.min_price),
    views_count: num(game.views_count),
    downloads_count: num(game.downloads_count),
    purchases_count: num(game.purchases_count),
    traits,
  };
}

export function parseGamesPayload(payload: unknown): ParsedImport<ParsedGameRow> {
  if (typeof payload !== 'object' || payload == null) return { rows: [], malformed: 0 };
  const games = (payload as { games?: unknown }).games;
  if (!Array.isArray(games)) return { rows: [], malformed: 0 };
  const rows: ParsedGameRow[] = [];
  let malformed = 0;
  for (const game of games) {
    if (
      typeof game !== 'object' ||
      game == null ||
      !(
        (typeof game.id === 'string' && game.id.length > 0) ||
        (typeof game.id === 'number' && Number.isFinite(game.id))
      )
    ) {
      malformed += 1;
      continue;
    }
    rows.push(normalizeGame(game));
  }
  return { rows, malformed };
}
