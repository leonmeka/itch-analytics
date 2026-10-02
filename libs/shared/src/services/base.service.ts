import { InternalServerErrorException, Logger } from '@nestjs/common';
import { SQL } from 'drizzle-orm';

import { QueryConfig, TableName, TSchema } from '../db/db.inference';

import { BaseRepository, PgTransaction } from '../repositories/base.repository';

export abstract class BaseService<
  TEntity,
  TCreateEntity extends object,
  TUpdateEntity extends Partial<object>,
  TWithRelationsEntity,
  TTableName extends TableName,
> {
  protected readonly logger: Logger;

  constructor(protected readonly baseRepository: BaseRepository<TSchema, any, TTableName>) {
    this.logger = new Logger(this.constructor.name);
  }

  async transaction<T>(callback: (tx: PgTransaction) => Promise<T>): Promise<T> {
    return this.baseRepository.transaction(callback);
  }

  async create(newEntity: TCreateEntity): Promise<TEntity> {
    try {
      return (await this.baseRepository.create(newEntity)) as TEntity;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create object:', error);
    }
  }

  async createMany(newEntities: TCreateEntity[]): Promise<TEntity[]> {
    try {
      return (await this.baseRepository.createMany(newEntities)) as TEntity[];
    } catch (error) {
      throw new InternalServerErrorException('Failed to create objects:', error);
    }
  }

  async find<TQueryConfig extends QueryConfig<TTableName>>(
    options?: TQueryConfig,
  ): Promise<TWithRelationsEntity | null> {
    try {
      return (await this.baseRepository.find(options)) as TWithRelationsEntity | null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to find object:', error);
    }
  }

  async findMany<TQueryConfig extends QueryConfig<TTableName>>(
    options?: TQueryConfig,
  ): Promise<TWithRelationsEntity[]> {
    try {
      return (await this.baseRepository.findMany(options)) as TWithRelationsEntity[];
    } catch (error) {
      throw new InternalServerErrorException('Failed to find objects:', error);
    }
  }

  async update(id: string, updateEntity: TUpdateEntity): Promise<TEntity> {
    try {
      return (await this.baseRepository.update(id, updateEntity)) as TEntity;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update object:', error);
    }
  }

  async updateMany(updateEntity: TUpdateEntity, where?: SQL<unknown>): Promise<TEntity[]> {
    try {
      return (await this.baseRepository.updateMany(updateEntity, where)) as TEntity[];
    } catch (error) {
      throw new InternalServerErrorException('Failed to update objects:', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.baseRepository.delete(id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete object:', error);
    }
  }

  async deleteMany(where?: SQL<unknown>): Promise<void> {
    try {
      await this.baseRepository.deleteMany(where);
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete objects:', error);
    }
  }

  async count(where?: SQL<unknown>): Promise<number> {
    try {
      return await this.baseRepository.count(where);
    } catch (error) {
      throw new InternalServerErrorException('Failed to count objects:', error);
    }
  }

  async exists(where?: SQL<unknown>): Promise<boolean> {
    try {
      return await this.baseRepository.exists(where);
    } catch (error) {
      throw new InternalServerErrorException('Failed to check object existence:', error);
    }
  }
}
