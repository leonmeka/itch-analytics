import type { UserWithRevenueDto } from '@itch/protocol';
import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, isNotNull, ne, sql } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DATABASE_KEY } from '../db/db.constants';
import { schema, TSchema } from '../db/db.inference';
import { OAuthProvider } from '../types/oauth-identities.types';
import { BaseRepository } from './base.repository';

@Injectable()
export class UsersRepository extends BaseRepository<
  TSchema,
  typeof schema.usersTable,
  'usersTable'
> {
  constructor(@Inject(DATABASE_KEY) database: NodePgDatabase<TSchema>) {
    super(database, schema.usersTable, 'usersTable');
  }

  async getUsersWithRevenue(limit: number, offset: number): Promise<UserWithRevenueDto[]> {
    const result = await this.database
      .select({
        id: schema.usersTable.id,
        username: schema.oauthIdentitiesTable.username,
        revenue_cents: sql<number>`coalesce(sum(${schema.paymentsTable.amount_cents}), 0)::double precision`,
      })
      .from(schema.usersTable)
      .innerJoin(
        schema.oauthIdentitiesTable,
        and(
          eq(schema.oauthIdentitiesTable.user_id, schema.usersTable.id),
          eq(schema.oauthIdentitiesTable.provider, OAuthProvider.Itch),
        ),
      )
      .leftJoin(schema.paymentsTable, eq(schema.paymentsTable.user_id, schema.usersTable.id))
      .where(
        and(
          isNotNull(schema.oauthIdentitiesTable.username),
          ne(schema.oauthIdentitiesTable.username, ''),
        ),
      )
      .groupBy(schema.usersTable.id, schema.oauthIdentitiesTable.username)
      .orderBy(
        desc(sql`coalesce(sum(${schema.paymentsTable.amount_cents}), 0)`),
        asc(schema.oauthIdentitiesTable.username),
      )
      .limit(limit)
      .offset(offset);

    return result as UserWithRevenueDto[];
  }
}
