import {
  ItchClaimedRewardsDto,
  ItchCredentialsDto,
  ItchGameAnalyticsDto,
  ItchProfileDto,
  MetricsOverviewDto,
} from '@itch/protocol';
import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type AuthenticatedRequest, AuthGuard, ItchKeysService } from '@/libs/auth';
import { ItchService } from '@/libs/itch';

@ApiTags('itch')
@Controller('itch')
@UseGuards(AuthGuard)
export class ItchController {
  constructor(
    private readonly itchService: ItchService,
    private readonly itchKeysService: ItchKeysService,
  ) {}

  @Get('me')
  async getItchProfile(@Req() request: AuthenticatedRequest): Promise<ItchProfileDto | null> {
    const accessToken = this.getItchAccessToken(request);

    if (!accessToken) return null;

    return this.itchService.getProfile(accessToken);
  }

  @Get('games')
  async getMyGames(@Req() request: AuthenticatedRequest): Promise<ItchGameAnalyticsDto[]> {
    const accessToken = this.getItchAccessToken(request);
    if (!accessToken) return [];

    const apiKey = await this.itchKeysService.getKeyForUser(request.user.id);

    return this.itchService.getMyGames(accessToken, apiKey);
  }

  /** Account-wide daily views/downloads/purchases series (legacy API). */
  @Get('graphs')
  async getGraphs(@Req() request: AuthenticatedRequest): Promise<MetricsOverviewDto | null> {
    const accessToken = this.getItchAccessToken(request);
    if (!accessToken) return null;

    const apiKey = await this.itchKeysService.getKeyForUser(request.user.id);
    const graphs = await this.itchService.getGraphs([accessToken, apiKey]);

    return {
      views_series: graphs.views.map((point) => ({ date: point.date, value: point.count })),
      downloads_series: graphs.downloads.map((point) => ({ date: point.date, value: point.count })),
      purchases_series: graphs.purchases.map((point) => ({ date: point.date, value: point.count })),
    };
  }

  @Get('games/:gameId/rewards')
  async getClaimedRewards(
    @Req() request: AuthenticatedRequest,
    @Param('gameId') gameId: string,
    @Query('page') page?: string,
  ): Promise<ItchClaimedRewardsDto | null> {
    const accessToken = this.getItchAccessToken(request);
    if (!accessToken) return null;

    const parsedPage = Number.parseInt(page ?? '', 10);

    return this.itchService.getClaimedRewards(
      accessToken,
      gameId,
      Number.isFinite(parsedPage) ? parsedPage : 1,
    );
  }

  @Get('credentials')
  async getCredentials(@Req() request: AuthenticatedRequest): Promise<ItchCredentialsDto | null> {
    const accessToken = this.getItchAccessToken(request);
    if (!accessToken) return null;

    return this.itchService.getCredentials(accessToken);
  }

  private getItchAccessToken(request: AuthenticatedRequest): string | null {
    const raw = request.headers['x-itch-token'];

    if (typeof raw !== 'string' || raw.length === 0) {
      return null;
    }

    return raw;
  }
}
