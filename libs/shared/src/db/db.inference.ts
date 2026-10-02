import type {
  DBQueryConfig,
  ExtractTablesWithRelations,
  InferInsertModel,
  InferSelectModel,
  SQL,
  Table,
} from 'drizzle-orm';
import * as oauthIdentities from './schemas/oauth-identities.sql';
import * as refreshTokens from './schemas/refresh-tokens.sql';
import * as users from './schemas/users.sql';

export const schema = {
  ...oauthIdentities,
  ...refreshTokens,
  ...users,
};

export type TSchema = typeof schema;

export type { InferSelectModel };

export type TTable = ExtractTablesWithRelations<TSchema>;
export type TableName = keyof TTable;

export type QueryConfig<TTableName extends TableName> = DBQueryConfig<
  'many',
  true,
  ExtractTablesWithRelations<TSchema>,
  ExtractTablesWithRelations<TSchema>[TTableName]
>;

export type ViewQueryConfig = {
  where?: SQL;
  orderBy?: SQL;
  limit?: number;
  offset?: number;
  extras?: Record<string, SQL.Aliased>;
};

export type InferCreateModel<T extends Table> = InferInsertModel<T>;
export type InferUpdateModel<T extends Table> = Partial<InferInsertModel<T>>;
