import { Module } from '@nestjs/common';

import { DatabaseModule } from '../db/db.module';
import { OAuthIdentitiesRepository } from '../repositories/oauth-identities.repository';
import { OAuthIdentitiesService } from '../services/oauth-identities.service';

@Module({
  imports: [DatabaseModule],
  providers: [OAuthIdentitiesService, OAuthIdentitiesRepository],
  exports: [OAuthIdentitiesService],
})
export class OAuthIdentitiesModule {}
