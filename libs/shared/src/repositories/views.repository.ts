import type { ViewsGraphPointDto, ViewsGraphsDto } from '@itch/protocol';
import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DATABASE_KEY } from '../db/db.constants';
import { schema, TSchema } from '../db/db.inference';
import { BaseRepository } from './base.repository';

@Injectable()
export class ViewsRepository extends BaseRepository<
  TSchema,
  typeof schema.viewsTable,
  'viewsTable'
> {
  constructor(@Inject(DATABASE_KEY) database: NodePgDatabase<TSchema>) {
    super(database, schema.viewsTable, 'viewsTable');
  }

  async getGraph(userId: string): Promise<ViewsGraphsDto> {
    const result = await this.database
      .select({
        date: schema.viewsTable.date,
        value: sql<number>`(sum(sum(${schema.viewsTable.count})) OVER (ORDER BY ${schema.viewsTable.date}))::double precision`,
      })
      .from(schema.viewsTable)
      .where(eq(schema.viewsTable.user_id, userId))
      .groupBy(schema.viewsTable.date)
      .orderBy(asc(schema.viewsTable.date));

    return { views: result as ViewsGraphPointDto[] };
  }
}
