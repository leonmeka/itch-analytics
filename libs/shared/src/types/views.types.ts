import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { schema } from '../db/db.inference';

export type GameView = InferSelectModel<typeof schema.viewsTable>;
export type CreateGameView = InferInsertModel<typeof schema.viewsTable>;
export type UpdateGameView = Partial<CreateGameView>;

export type GameViewWithRelations = GameView;
