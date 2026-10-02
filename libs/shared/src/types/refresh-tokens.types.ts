import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { schema } from '../db/db.inference';
import type { UserWithRelations } from './users.types';

export type RefreshToken = InferSelectModel<typeof schema.refreshTokensTable>;
export type CreateRefreshToken = InferInsertModel<typeof schema.refreshTokensTable>;
export type UpdateRefreshToken = Partial<CreateRefreshToken>;

export type RefreshTokenWithRelations = RefreshToken & {
  user: UserWithRelations;
};
