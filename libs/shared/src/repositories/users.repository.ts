import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DATABASE_KEY } from '../db/db.constants';
import { schema, TSchema } from '../db/db.inference';
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
}
