import { Injectable } from '@nestjs/common';

import { OAuthIdentitiesRepository } from '../repositories/oauth-identities.repository';
import type {
  CreateOAuthIdentity,
  OAuthIdentity,
  UpdateOAuthIdentity,
} from '../types/oauth-identities.types';
import { BaseService } from './base.service';

@Injectable()
export class OAuthIdentitiesService extends BaseService<
  OAuthIdentity,
  CreateOAuthIdentity,
  UpdateOAuthIdentity,
  OAuthIdentity,
  'oauthIdentitiesTable'
> {
  constructor(protected readonly oauthIdentitiesRepository: OAuthIdentitiesRepository) {
    super(oauthIdentitiesRepository);
  }
}
