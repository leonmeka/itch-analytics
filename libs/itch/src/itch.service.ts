import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type { ItchGame, ItchProfile, ItchRawGamesResponse, ItchRawProfile } from './itch.types';

@Injectable()
export class ItchService {
  private readonly logger = new Logger(ItchService.name);

  constructor(private readonly httpService: HttpService) {}

  async getProfile(accessToken: string): Promise<ItchProfile | null> {
    let data: ItchRawProfile;

    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get<ItchRawProfile>('/profile', this.auth(accessToken)),
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

  async getMyGames(accessToken: string): Promise<ItchGame[]> {
    let data: ItchRawGamesResponse;

    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get<ItchRawGamesResponse>('/profile/games', this.auth(accessToken)),
      );
      data = body;
    } catch (error) {
      this.logger.warn(
        'failed to fetch itch games (is profile:games in the OAuth scope?)',
        error instanceof Error ? error.message : error,
      );

      return [];
    }

    return (data.games ?? []).map((game) => ({
      id: String(game.id ?? ''),
      url: game.url ?? null,
      title: game.title ?? null,
      cover_url: game.cover_url ?? null,
      published_at: game.published_at ?? null,
      views_count: game.views_count ?? null,
      downloads_count: game.downloads_count ?? null,
    }));
  }

  private auth(accessToken: string) {
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    };
  }
}
