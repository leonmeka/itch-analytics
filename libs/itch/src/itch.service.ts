import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import type {
  ItchClaimedReward,
  ItchClaimedRewards,
  ItchCredentials,
  ItchEarning,
  ItchGame,
  ItchGraphPoint,
  ItchGraphs,
  ItchProfile,
  ItchRawClaimedRewardsResponse,
  ItchRawCredentials,
  ItchRawGamesResponse,
  ItchRawGraphsResponse,
  ItchRawProfile,
  ItchSubProduct,
} from './itch.types';
import type { ItchRawGameData } from './itch.types';

/**
 * itch.io client for OAuth'd users. The itch access token issued by the
 * implicit OAuth flow doubles as the API key for api.itch.io (Authorization:
 * Bearer), scoped by the grants the user approved — `profile:me` for the
 * profile, `profile:games` for the games the user develops (the analytics
 * core: views/downloads/purchases/earnings) and `game:view:rewards` for
 * claimed rewards.
 */
@Injectable()
export class ItchService {
  private readonly logger = new Logger(ItchService.name);

  constructor(private readonly httpService: HttpService) {}

  /** Diagnostics: what the token can actually access (scopes, expiry). */
  async getCredentials(accessToken: string): Promise<ItchCredentials | null> {
    let data: ItchRawCredentials;

    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get<ItchRawCredentials>('/credentials/info', this.auth(accessToken)),
      );
      data = body;
    } catch (error) {
      this.logger.warn(
        'failed to fetch itch credentials info',
        error instanceof Error ? error.message : error,
      );

      return null;
    }

    return {
      type: data.type === 'key' || data.type === 'jwt' ? data.type : null,
      scopes: data.scopes ?? [],
      expires_at: data.expires_at ?? null,
    };
  }

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

  async getMyGames(accessToken: string, apiKey: string | null = null): Promise<ItchGame[]> {
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

    if (data.games != null && !Array.isArray(data.games)) {
      this.logger.warn(`unexpected games payload shape: ${JSON.stringify(data).slice(0, 600)}`);
    }

    const rawGames = Array.isArray(data.games) ? data.games : [];

    const games = rawGames.map((game) => ({
      id: String(game.id ?? ''),
      url: game.url ?? null,
      title: game.title ?? null,
      short_text: game.short_text ?? null,
      cover_url: game.cover_url ?? null,
      published: game.published ?? false,
      published_at: game.published_at ?? null,
      created_at: game.created_at ?? null,
      min_price: game.min_price ?? null,
      views_count: game.views_count ?? null,
      downloads_count: game.downloads_count ?? null,
      purchases_count: game.purchases_count ?? null,
      earnings: (game.earnings ?? []).map(
        (earning): ItchEarning => ({
          currency: earning.currency ?? '',
          amount: earning.amount ?? 0,
          amount_formatted: earning.amount_formatted ?? '',
        }),
      ),
    }));

    await this.enrichWithRevenue(games, apiKey);

    return games;
  }

  /**
   * itch.io strips `earnings` (revenue) from OAuth-scoped payloads and
   * offers no scope to unlock it — the account's own unscoped API key
   * (user settings) against the LEGACY my-games route is the only source
   * (the field appears there once a game has gross revenue; it is omitted
   * entirely for $0-revenue games, which is not an error). Merged per game
   * id; games the key cannot see are left untouched.
   */
  private async enrichWithRevenue(games: ItchGame[], apiKey: string | null): Promise<void> {
    if (games.length === 0 || !apiKey) return;

    let data: ItchRawGamesResponse;

    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get<ItchRawGamesResponse>(
          `https://itch.io/api/1/${apiKey}/my-games`,
          this.auth(apiKey),
        ),
      );
      data = body;
    } catch (error) {
      this.logger.warn(
        'failed to fetch revenue via the stored account API key',
        error instanceof Error ? error.message : error,
      );
      return;
    }

    const rawRevenueGames = Array.isArray(data.games) ? data.games : [];
    const earningsById = new Map(
      rawRevenueGames.map((game) => [
        String(game.id ?? ''),
        (game.earnings ?? []).map(
          (earning): ItchEarning => ({
            currency: earning.currency ?? '',
            amount: earning.amount ?? 0,
            amount_formatted: earning.amount_formatted ?? '',
          }),
        ),
      ]),
    );

    for (const game of games) {
      const earnings = earningsById.get(game.id);

      if (earnings && earnings.length > 0) {
        game.earnings = earnings;
      }
    }
  }

  /** Verifies an itch.io API key works (GET /credentials/info with it). */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<ItchRawCredentials>('/credentials/info', this.auth(apiKey)),
      );

      return data?.type === 'key';
    } catch {
      return false;
    }
  }

  /**
   * Public sub-product catalog of a game (no auth): the main product is
   * typically free while purchasable sub-products (DLC) are attached to it.
   * data.json is itch's public page-data endpoint; revenue is NOT part of
   * it — callers combine this with purchases_count for estimates.
   */
  async getSubProducts(gameUrl: string): Promise<ItchSubProduct[]> {
    let data: ItchRawGameData;

    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get<ItchRawGameData>(
          `${gameUrl.replace(/\/$/, '')}/data.json`,
          { headers: { Accept: 'application/json' } },
        ),
      );
      data = body;
    } catch {
      return [];
    }

    if (!data || Array.isArray(data.errors)) return [];

    return (data.sub_products ?? []).map((subProduct) => ({
      id: subProduct.id ?? 0,
      name: subProduct.name ?? '',
      price: subProduct.price ?? '',
    }));
  }

  /** Claimed rewards for one of the user's games (paginated, newest first). */
  async getClaimedRewards(
    accessToken: string,
    gameId: string,
    page = 1,
  ): Promise<ItchClaimedRewards | null> {
    let data: ItchRawClaimedRewardsResponse;

    try {
      const { data: body } = await firstValueFrom(
        this.httpService.get<ItchRawClaimedRewardsResponse>(`/games/${gameId}/claimed-rewards`, {
          ...this.auth(accessToken),
          params: { page },
        }),
      );
      data = body;
    } catch (error) {
      this.logger.warn(
        `failed to fetch claimed rewards for game ${gameId} (is game:view:rewards in the OAuth scope?)`,
        error instanceof Error ? error.message : error,
      );

      return null;
    }

    // itch returns claimed_rewards: {} (an object, not an array) when the
    // list is empty — only flag genuinely unexpected shapes.
    const rawClaimed = data.claimed_rewards;

    if (rawClaimed != null && !Array.isArray(rawClaimed) && Object.keys(rawClaimed).length > 0) {
      this.logger.warn(
        `unexpected claimed_rewards shape for game ${gameId}: ${JSON.stringify(data).slice(0, 600)}`,
      );
    }

    const rawRewards = Array.isArray(rawClaimed) ? rawClaimed : [];

    const rewards = rawRewards.map(
      (claimed): ItchClaimedReward => ({
        id: String(claimed.id ?? ''),
        shortcode: claimed.shortcode ?? null,
        reward_id: claimed.reward?.id != null ? String(claimed.reward.id) : null,
        reward_title: claimed.reward?.title ?? null,
        reward_type: claimed.reward?.type ?? null,
        claimed_at: claimed.purchase?.created_at ?? null,
      }),
    );

    return {
      page: data.page ?? page,
      per_page: data.per_page ?? 0,
      total_items: data.total_items ?? rewards.length,
      rewards,
    };
  }

  /**
   * Account-wide daily views/downloads/purchases series — only the
   * semi-documented legacy endpoint exposes time-series data. Tries
   * Bearer-auth first, then the token/key-in-path forms the legacy host
   * accepts.
   */
  async getGraphs(credentials: Array<string | null>): Promise<ItchGraphs> {
    for (const credential of credentials) {
      if (!credential) continue;

      for (const url of [
        'https://itch.io/api/1/my-games/graphs',
        `https://itch.io/api/1/${credential}/my-games/graphs`,
      ]) {
        let data: ItchRawGraphsResponse;

        try {
          const { data: body } = await firstValueFrom(
            this.httpService.get<ItchRawGraphsResponse>(url, this.auth(credential)),
          );
          data = body;
        } catch {
          continue;
        }

        return {
          views: this.parseGraphSeries(data.views),
          downloads: this.parseGraphSeries(data.downloads),
          purchases: this.parseGraphSeries(data.purchases),
        };
      }
    }

    return { views: [], downloads: [], purchases: [] };
  }

  /** itch returns empty OBJECTS (not arrays) for empty series. */
  private parseGraphSeries(series: ItchRawGraphsResponse['views']): ItchGraphPoint[] {
    if (!Array.isArray(series)) return [];

    return series.map((point) => ({
      date: point.date ?? '',
      count: point.count ?? 0,
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
