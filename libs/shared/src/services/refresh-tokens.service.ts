import { Injectable } from '@nestjs/common';

import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import type {
  CreateRefreshToken,
  RefreshToken,
  UpdateRefreshToken,
} from '../types/refresh-tokens.types';
import { BaseService } from './base.service';

@Injectable()
export class RefreshTokensService extends BaseService<
  RefreshToken,
  CreateRefreshToken,
  UpdateRefreshToken,
  RefreshToken,
  'refreshTokensTable'
> {
  constructor(protected readonly refreshTokensRepository: RefreshTokensRepository) {
    super(refreshTokensRepository);
  }
}
