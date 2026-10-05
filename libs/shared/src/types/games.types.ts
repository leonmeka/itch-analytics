import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import { schema } from '../db/db.inference';

export type Game = InferSelectModel<typeof schema.gamesTable>;
export type CreateGame = InferInsertModel<typeof schema.gamesTable>;
export type UpdateGame = Partial<CreateGame>;

export type GameWithRelations = Game;
