import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { schema } from '../db/db.inference';

export type ApiKey = InferSelectModel<typeof schema.apiKeysTable>;
export type CreateApiKey = InferInsertModel<typeof schema.apiKeysTable>;
export type UpdateApiKey = Partial<CreateApiKey>;

export type ApiKeyWithRelations = ApiKey;
