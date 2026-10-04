import type { UserProfileDto, UserWithRevenueDto } from '@itch/protocol';
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
        avatar_url: schema.oauthIdentitiesTable.avatar_url,
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
      .groupBy(
        schema.usersTable.id,
        schema.oauthIdentitiesTable.username,
        schema.oauthIdentitiesTable.avatar_url,
      )
      .orderBy(
        desc(sql`coalesce(sum(${schema.paymentsTable.amount_cents}), 0)`),
        asc(schema.oauthIdentitiesTable.username),
      )
      .limit(limit)
      .offset(offset);

    return result as UserWithRevenueDto[];
  }

  async getUserProfile(userId: string): Promise<UserProfileDto | null> {
    const [profile] = await this.database
      .select({
        user_id: schema.usersTable.id,
        username: schema.oauthIdentitiesTable.username,
        name: schema.oauthIdentitiesTable.name,
        avatar_url: schema.oauthIdentitiesTable.avatar_url,
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
      .where(eq(schema.usersTable.id, userId))
      .groupBy(
        schema.usersTable.id,
        schema.oauthIdentitiesTable.username,
        schema.oauthIdentitiesTable.name,
        schema.oauthIdentitiesTable.avatar_url,
      );

    return profile ?? null;
  }
}
