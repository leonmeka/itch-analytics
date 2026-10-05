import { Injectable } from '@nestjs/common';

import { ApiKeysRepository } from '../repositories/api-keys.repository';
import type { ApiKey, CreateApiKey, UpdateApiKey } from '../types/api-keys.types';
import { BaseService } from './base.service';

@Injectable()
export class ApiKeysService extends BaseService<
  ApiKey,
  CreateApiKey,
  UpdateApiKey,
  ApiKey,
  'apiKeysTable'
> {
  constructor(protected readonly apiKeysRepository: ApiKeysRepository) {
    super(apiKeysRepository);
  }
}
