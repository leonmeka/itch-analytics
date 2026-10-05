import { Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { GamesService, schema, ViewsService } from '@/libs/shared';
import type { ImportSummary } from '../imports/import.types';
import { diffImportRow } from '../imports/import.utils';
import { type ParsedViewRow, parseViewsPayload } from './views.parser';

@Injectable()
export class ViewsImporterService {
  constructor(
    private readonly gamesService: GamesService,
    private readonly viewsService: ViewsService,
  ) {}

  async import(userId: string, payload: unknown): Promise<ImportSummary> {
    const { rows: parsed, malformed } = parseViewsPayload(payload);

    const deduped = new Map<string, ParsedViewRow>();
    for (const row of parsed) {
      deduped.set(`${row.gameId}|${row.date}`, row);
    }

    const games = await this.gamesService.findMany({
      where: eq(schema.gamesTable.user_id, userId),
    });
    const gamesByExternalId = new Map(games.map((game) => [game.external_id, game]));

    const resolved: { gameId: string; date: string; count: number }[] = [];
    let unresolved = 0;
    for (const row of deduped.values()) {
      const game = gamesByExternalId.get(row.gameId);

      if (!game) {
        unresolved += 1;
        continue;
      }

      resolved.push({ gameId: game.id, date: row.date, count: row.count });
    }

    const gameIds = [...new Set(resolved.map((row) => row.gameId))];
    const dates = [...new Set(resolved.map((row) => row.date))];

    if (resolved.length === 0)
      return { total: 0, imported: 0, updated: 0, skipped: unresolved + malformed };

    const existing = await this.viewsService.findMany({
      where: and(
        eq(schema.viewsTable.user_id, userId),
        gameIds.length > 0 ? inArray(schema.viewsTable.game_id, gameIds) : undefined,
        dates.length > 0 ? inArray(schema.viewsTable.date, dates) : undefined,
      ),
    });

    const existingByKey = new Map(existing.map((view) => [`${view.game_id}|${view.date}`, view]));

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of resolved) {
      const key = `${row.gameId}|${row.date}`;
      const current = existingByKey.get(key);

      if (!current) {
        await this.viewsService.create({
          user_id: userId,
          game_id: row.gameId,
          date: row.date,
          count: row.count,
        });
        imported += 1;
        continue;
      }

      const changes = diffImportRow(current, { count: row.count }, ['count']);
      if (!changes) {
        skipped += 1;
        continue;
      }

      await this.viewsService.update(current.id, changes);
      updated += 1;
    }

    return {
      total: resolved.length,
      imported,
      updated,
      skipped: skipped + unresolved + malformed,
    };
  }
}
