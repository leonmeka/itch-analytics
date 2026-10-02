import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { schema } from '../db/db.inference';
import type { UserWithRelations } from './users.types';

export enum OAuthProvider {
  Itch = 'itch',
}

export type OAuthIdentity = InferSelectModel<typeof schema.oauthIdentitiesTable>;
export type CreateOAuthIdentity = InferInsertModel<typeof schema.oauthIdentitiesTable>;
export type UpdateOAuthIdentity = Partial<CreateOAuthIdentity>;

export type OAuthIdentityWithRelations = OAuthIdentity & {
  user: UserWithRelations;
};
