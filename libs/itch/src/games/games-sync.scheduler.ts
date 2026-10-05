import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { ApiKeysService, OAuthIdentitiesService } from '@/libs/shared';
import { GamesImporterService } from './games-importer.service';

@Injectable()
export class GamesSyncScheduler {
  private readonly logger = new Logger(GamesSyncScheduler.name);

  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly gamesImporterService: GamesImporterService,
    private readonly oauthIdentitiesService: OAuthIdentitiesService,
  ) {}

  @Cron('0 0 */6 * * *')
  async syncAll(): Promise<void> {
    const [identities, keys] = await Promise.all([
      this.oauthIdentitiesService.findMany(),
      this.apiKeysService.findMany(),
    ]);
    const identitiesWithKeys = new Set(keys.map((key) => key.oauth_identity_id));

    for (const identity of identities) {
      if (!identitiesWithKeys.has(identity.id)) continue;

      try {
        const summary = await this.gamesImporterService.sync(identity.user_id);
        this.logger.log(
          `Synced games for user=${identity.user_id}: imported=${summary.imported} updated=${summary.updated} skipped=${summary.skipped}`,
        );
      } catch (error) {
        this.logger.warn(
          `Games sync failed for user=${identity.user_id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
