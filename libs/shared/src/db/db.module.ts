import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { DATABASE_KEY, DATABASE_URL_KEY } from './db.constants';
import { schema, TSchema } from './db.inference';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_URL_KEY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): string =>
        configService.getOrThrow<string>('API_DATABASE_URL'),
    },
    {
      provide: DATABASE_KEY,
      inject: [DATABASE_URL_KEY],
      useFactory: (connectionString: string): NodePgDatabase<TSchema> => {
        const pool = new Pool({ connectionString });

        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DATABASE_URL_KEY, DATABASE_KEY],
})
export class DatabaseModule {}
