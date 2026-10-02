import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type { ItchGame, ItchProfile, ItchRawGamesResponse, ItchRawProfile } from './itch.types';

/**
 * itch.io client for OAuth'd users. The itch access token issued by the
 * implicit OAuth flow doubles as the API key for api.itch.io (Authorization:
 * Bearer), scoped by the grants the user approved — e.g. `profile:me` for
 * the profile and `profile:games` for the games the user develops.
 */
@Injectable()
export class ItchService {
  constructor(private readonly httpService: HttpService) {}

  async getProfile(accessToken: string): Promise<ItchProfile | null> {
    let data: ItchRawProfile;

    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get<ItchRawProfile>('/profile', this.auth(accessToken)),
      );
      data = body;
    } catch {
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
    } catch {
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
