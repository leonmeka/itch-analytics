import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { GamesService, schema } from '@/libs/shared';
import type { ImportSummary } from '../imports/import.types';
import { diffImportRow } from '../imports/import.utils';
import { parseGamesPayload } from './games.parser';

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

@Injectable()
export class GamesImporterService {
  constructor(private readonly gamesService: GamesService) {}

  async import(userId: string, payload: unknown): Promise<ImportSummary> {
    const { rows, malformed } = parseGamesPayload(payload);
    const games = [...new Map(rows.map((row) => [row.external_id, row])).values()];
    if (games.length === 0) return { total: 0, imported: 0, updated: 0, skipped: malformed };

    const externalIds = [...new Set(games.map((game) => game.external_id))];

    const existing = await this.gamesService.findMany({
      where: and(
        eq(schema.gamesTable.user_id, userId),
        inArray(schema.gamesTable.external_id, externalIds),
      ),
    });

    const existingById = new Map(existing.map((game) => [game.external_id, game]));

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const game of games) {
      const externalId = game.external_id;
      const row = { ...game, user_id: userId };
      const current = existingById.get(externalId);

      if (!current) {
        await this.gamesService.create(row);
        imported += 1;
        continue;
      }

      const changes = diffImportRow(current, row, UPDATABLE_FIELDS);

      if (changes) {
        await this.gamesService.update(current.id, changes);
        updated += 1;
      } else {
        skipped += 1;
      }
    }

    return { total: games.length, imported, updated, skipped: skipped + malformed };
  }
}
