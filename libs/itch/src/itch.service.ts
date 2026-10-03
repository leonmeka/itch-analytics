import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type { ItchProfile, ItchRawProfile } from './itch.types';

/**
 * itch.io client for OAuth'd users. The itch access token issued by the
 * implicit OAuth flow doubles as the API key for api.itch.io (Authorization:
 * Bearer), scoped by the grants the user approved.
 */
@Injectable()
export class ItchService {
  private readonly logger = new Logger(ItchService.name);

  constructor(private readonly httpService: HttpService) {}

  async getProfile(accessToken: string): Promise<ItchProfile | null> {
    let data: ItchRawProfile;

    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get<ItchRawProfile>('/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
        }),
      );
      data = body;
    } catch (error) {
      this.logger.warn(
        'failed to fetch itch profile',
        error instanceof Error ? error.message : error,
      );

      return null;
    }

    const user = data.user ?? {};

    return {
      id: String(user.id ?? ''),
      username: user.username ?? user.url_name ?? '',
      display_name: user.display_name ?? null,
      avatar_url: user.avatar_url ?? null,
    };
  }
}
