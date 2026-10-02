import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { schema } from '../db/db.inference';
import type { OAuthIdentityWithRelations } from './oauth-identities.types';
import type { RefreshTokenWithRelations } from './refresh-tokens.types';

export type User = InferSelectModel<typeof schema.usersTable>;
export type CreateUser = InferInsertModel<typeof schema.usersTable>;
export type UpdateUser = Partial<CreateUser>;

export type UserWithRelations = User & {
  oauth_identities: OAuthIdentityWithRelations[];
  refresh_tokens: RefreshTokenWithRelations[];
};
