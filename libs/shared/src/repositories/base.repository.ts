import { Logger } from '@nestjs/common';
import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm';
import { asc, count, eq, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';

import { InferCreateModel, InferUpdateModel, TSchema } from '../db/db.inference';

export type TransactionCallback<TSchemaType extends Record<string, unknown> = TSchema> = Parameters<
  NodePgDatabase<TSchemaType>['transaction']
>[0];

export type PgTransaction<TSchemaType extends Record<string, unknown> = TSchema> = Parameters<
  TransactionCallback<TSchemaType>
>[0];

export abstract class BaseRepository<
  TSchemaType extends Record<string, unknown>,
  TTable extends PgTableWithColumns<any>,
  TTableName extends keyof ExtractTablesWithRelations<TSchemaType>,
> {
  protected readonly logger: Logger;

  constructor(
    protected readonly database: NodePgDatabase<TSchemaType>,
    protected readonly table: TTable,
    protected readonly tableName: TTableName,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  async transaction<T>(callback: (tx: PgTransaction<TSchemaType>) => Promise<T>): Promise<T> {
    return this.database.transaction(callback);
  }

  async create(
    data: InferCreateModel<TTable>,
  ): Promise<
    BuildQueryResult<
      ExtractTablesWithRelations<TSchemaType>,
      ExtractTablesWithRelations<TSchemaType>[TTableName],
      Record<string, never>
    >
  > {
    try {
      const [entity] = await this.database.insert(this.table).values(data).returning();

      this.logger.log('Created entity:', `id=${entity?.id ?? null}`);

      return entity as BuildQueryResult<
        ExtractTablesWithRelations<TSchemaType>,
        ExtractTablesWithRelations<TSchemaType>[TTableName],
        Record<string, never>
      >;
    } catch (error) {
      this.logger.error(
        'Failed to create entity:',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async createMany(
    data: InferCreateModel<TTable>[],
  ): Promise<
    BuildQueryResult<
      ExtractTablesWithRelations<TSchemaType>,
      ExtractTablesWithRelations<TSchemaType>[TTableName],
      Record<string, never>
    >[]
  > {
    try {
      const entities = await this.database.insert(this.table).values(data).returning();

      this.logger.log('Created entities:', `count=${entities.length}`);

      return entities as BuildQueryResult<
        ExtractTablesWithRelations<TSchemaType>,
        ExtractTablesWithRelations<TSchemaType>[TTableName],
        Record<string, never>
      >[];
    } catch (error) {
      this.logger.error(
        'Failed to create entities:',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async find<
    TQueryConfig extends DBQueryConfig<
      'many',
      true,
      ExtractTablesWithRelations<TSchemaType>,
      ExtractTablesWithRelations<TSchemaType>[TTableName]
    >,
  >(
    options?: TQueryConfig,
  ): Promise<BuildQueryResult<
    ExtractTablesWithRelations<TSchemaType>,
    ExtractTablesWithRelations<TSchemaType>[TTableName],
    {
      columns: TQueryConfig['columns'];
      with: TQueryConfig['with'];
      extras: TQueryConfig['extras'];
    }
  > | null> {
    try {
      const entity = await (this.database.query as any)[this.tableName].findFirst({
        columns: options?.columns,
        extras: options?.extras,
        where: options?.where,
        orderBy: options?.orderBy,
        with: options?.with,
      });

      this.logger.log('Found entity:', `id=${entity?.id ?? null}`);

      return entity;
    } catch (error) {
      this.logger.error('Failed to find entity', error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  async findMany<
    TQueryConfig extends DBQueryConfig<
      'many',
      true,
      ExtractTablesWithRelations<TSchemaType>,
      ExtractTablesWithRelations<TSchemaType>[TTableName]
    >,
  >(
    options?: TQueryConfig,
  ): Promise<
    BuildQueryResult<
      ExtractTablesWithRelations<TSchemaType>,
      ExtractTablesWithRelations<TSchemaType>[TTableName],
      {
        columns: TQueryConfig['columns'];
        with: TQueryConfig['with'];
        extras: TQueryConfig['extras'];
      }
    >[]
  > {
    try {
      const entities = await (this.database.query as any)[this.tableName].findMany({
        columns: options?.columns,
        extras: options?.extras,
        where: options?.where,
        orderBy: options?.orderBy ?? asc(this.table.created_at),
        with: options?.with,
        limit: options?.limit,
        offset: options?.offset,
      });

      this.logger.log('Entities found:', `count=${entities.length}`);

      return entities;
    } catch (error) {
      this.logger.error(
        'Failed to find entities:',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async update(
    id: string,
    data: InferUpdateModel<TTable>,
  ): Promise<
    BuildQueryResult<
      ExtractTablesWithRelations<TSchemaType>,
      ExtractTablesWithRelations<TSchemaType>[TTableName],
      Record<string, never>
    >
  > {
    try {
      const result = await this.database
        .update(this.table)
        .set(data)
        .where(eq(this.table.id, id))
        .returning();

      const entity = Array.isArray(result) ? result[0] : result;

      this.logger.log(
        'Updated entity:',
        `id=${(entity as { id?: unknown } | undefined)?.id ?? null}`,
      );

      return entity as BuildQueryResult<
        ExtractTablesWithRelations<TSchemaType>,
        ExtractTablesWithRelations<TSchemaType>[TTableName],
        Record<string, never>
      >;
    } catch (error) {
      this.logger.error(
        'Failed to update entity:',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async updateMany(
    data: InferUpdateModel<TTable>,
    where?: SQL<unknown>,
  ): Promise<
    BuildQueryResult<
      ExtractTablesWithRelations<TSchemaType>,
      ExtractTablesWithRelations<TSchemaType>[TTableName],
      Record<string, never>
    >[]
  > {
    try {
      const result = await this.database.update(this.table).set(data).where(where).returning();

      const entities = Array.isArray(result) ? result : [result];

      this.logger.log('Updated multiple entities:', `count=${entities.length}`);

      return entities as BuildQueryResult<
        ExtractTablesWithRelations<TSchemaType>,
        ExtractTablesWithRelations<TSchemaType>[TTableName],
        Record<string, never>
      >[];
    } catch (error) {
      this.logger.error(
        'Failed to update entities:',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.database.delete(this.table).where(eq(this.table.id, id));

      this.logger.log('Deleted entity:', `id=${id}`);
    } catch (error) {
      this.logger.error(
        'Failed to delete entity:',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async deleteMany(where?: SQL<unknown>): Promise<void> {
    try {
      await this.database.delete(this.table).where(where);

      this.logger.log('Deleted multiple entities');
    } catch (error) {
      this.logger.error(
        'Failed to delete entities:',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async count(where?: SQL<unknown>): Promise<number> {
    try {
      const [result] = await this.database
        .select({ count: count() })
        .from(this.table as PgTableWithColumns<any>)
        .where(where);

      this.logger.log('Count result:', `count=${result.count}`);

      return result.count;
    } catch (error) {
      this.logger.error(
        'Failed to count entities:',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async exists(where?: SQL<unknown>): Promise<boolean> {
    try {
      const entity = await (this.database.query as any)[this.tableName].findFirst({
        columns: { id: true },
        where,
      });

      return entity != null;
    } catch (error) {
      this.logger.error(
        'Failed to check entity existence:',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
