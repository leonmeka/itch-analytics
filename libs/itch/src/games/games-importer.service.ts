import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { type CreateGame, GamesService, schema } from '@/libs/shared';

export interface GamesImportSummary {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
}

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

const UPDATABLE_FIELDS = [
  'url',
  'title',
  'short_text',
  'cover_url',
  'classification',
  'type',
  'published',
  'published_at',
  'external_created_at',
  'min_price',
  'views_count',
  'downloads_count',
  'purchases_count',
  'traits',
] as const;

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

@Injectable()
export class GamesImporterService {
  constructor(private readonly gamesService: GamesService) {}

  async import(userId: string, payload: unknown): Promise<GamesImportSummary> {
    const games = this.parseGames(payload);

    const externalIds = [...new Set(games.map((game) => String(game.id)))];

    const existing = await this.gamesService.findMany({
      where: and(
        eq(schema.gamesTable.user_id, userId),
        externalIds.length > 0 ? inArray(schema.gamesTable.external_id, externalIds) : undefined,
      ),
    });

    const existingById = new Map(existing.map((game) => [game.external_id, game]));

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const itchGame of games) {
      const externalId = String(itchGame.id);
      const row = this.mapGame(userId, itchGame);
      const current = existingById.get(externalId);

      if (!current) {
        await this.gamesService.create(row);
        imported += 1;
        continue;
      }

      const changes = this.diff(current, row);

      if (changes) {
        await this.gamesService.update(current.id, changes);
        updated += 1;
      } else {
        skipped += 1;
      }
    }

    return { total: games.length, imported, updated, skipped };
  }

  private parseGames(payload: unknown): ItchGame[] {
    if (typeof payload !== 'object' || payload == null) return [];

    const games = (payload as { games?: unknown }).games;

    if (!Array.isArray(games)) return [];

    return games.filter((game): game is ItchGame => typeof game === 'object' && game != null);
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
          : JSON.stringify(before ?? null) === JSON.stringify(after ?? null);

      if (!unchanged) {
        changes[field] = after;
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  private mapGame(userId: string, game: ItchGame): CreateGame {
    const traits = Array.isArray(game.traits)
      ? game.traits.filter((trait): trait is string => typeof trait === 'string')
      : null;

    return {
      user_id: userId,
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
}
