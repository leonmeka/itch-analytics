import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { DATABASE_KEY } from '../db/db.constants';
import { schema, TSchema } from '../db/db.inference';
import { BaseRepository } from './base.repository';

@Injectable()
export class PaymentsRepository extends BaseRepository<
  TSchema,
  typeof schema.paymentsTable,
  'paymentsTable'
> {
  constructor(@Inject(DATABASE_KEY) database: NodePgDatabase<TSchema>) {
    super(database, schema.paymentsTable, 'paymentsTable');
  }
}
