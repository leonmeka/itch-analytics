import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  GameDto,
  GamesImportResultDto,
  OauthIdentityDto,
  PaginationDto,
  PaymentDto,
  PaymentsFilterDto,
  PaymentsGraphsDto,
  PaymentsImportResultDto,
  PaymentsSummaryDto,
  UserDto,
  UserProfileDto,
  UserWithRevenueDto,
  ViewsGraphsDto,
  ViewsImportResultDto,
} from '@scratch/protocol';
import { and, asc, eq } from 'drizzle-orm';
import { type AuthenticatedRequest, AuthGuard } from '@/libs/auth';
import { GamesImporterService, PaymentsImporterService, ViewsImporterService } from '@/libs/itch';
import {
  GamesService,
  OAuthIdentitiesService,
  PaymentsService,
  schema,
  UsersService,
  ViewsService,
} from '@/libs/shared';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
    private readonly gamesService: GamesService,
    private readonly viewsService: ViewsService,
    private readonly paymentsImporterService: PaymentsImporterService,
    private readonly gamesImporterService: GamesImporterService,
    private readonly viewsImporterService: ViewsImporterService,
    private readonly oauthIdentitiesService: OAuthIdentitiesService,
  ) {}

  @Get()
  @UseGuards(AuthGuard)
  async list(@Query() pagination: PaginationDto): Promise<UserWithRevenueDto[]> {
    return this.usersService.getUsersWithRevenue(pagination.limit, pagination.offset);
  }

  @Get(':user_id')
  @UseGuards(AuthGuard)
  async get(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
  ): Promise<UserDto> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    const user = await this.usersService.find({
      where: eq(schema.usersTable.id, userId),
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return user;
  }

  @Get(':user_id/profile')
  @UseGuards(AuthGuard)
  async profile(@Param('user_id') userId: string): Promise<UserProfileDto> {
    const profile = await this.usersService.getUserProfile(userId);

    if (!profile) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    return profile;
  }

  @Get(':user_id/payments')
  @UseGuards(AuthGuard)
  async payments(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
    @Query() pagination: PaginationDto,
    @Query() filters: PaymentsFilterDto,
  ): Promise<PaymentDto[]> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    return this.paymentsService.getPayments(userId, filters, pagination.limit, pagination.offset);
  }

  @Get(':user_id/payments/summary')
  @UseGuards(AuthGuard)
  async paymentsSummary(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
    @Query() filters: PaymentsFilterDto,
  ): Promise<PaymentsSummaryDto> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    return this.paymentsService.getSummary(userId, filters);
  }

  @Get(':user_id/payments/graph')
  @UseGuards(AuthGuard)
  async paymentsGraph(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
    @Query() filters: PaymentsFilterDto,
  ): Promise<PaymentsGraphsDto> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    return this.paymentsService.getGraph(userId, filters);
  }

  @Get(':user_id/payments/:payment_id')
  @UseGuards(AuthGuard)
  async payment(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
    @Param('payment_id') paymentId: string,
  ): Promise<PaymentDto> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    const payment = await this.paymentsService.find({
      where: and(
        eq(schema.paymentsTable.user_id, userId),
        eq(schema.paymentsTable.external_id, paymentId),
      ),
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    return payment;
  }

  @Post(':user_id/payments')
  @UseGuards(AuthGuard)
  async importPayments(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
    @Body() body: { csv?: string },
  ): Promise<PaymentsImportResultDto> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    if (!body.csv || body.csv.trim().length === 0) {
      throw new BadRequestException('csv payload is required');
    }

    return this.paymentsImporterService.import(userId, body.csv);
  }

  @Get(':user_id/games')
  @UseGuards(AuthGuard)
  async games(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
    @Query() pagination: PaginationDto,
  ): Promise<GameDto[]> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    return this.gamesService.findMany({
      where: eq(schema.gamesTable.user_id, userId),
      orderBy: asc(schema.gamesTable.title),
      limit: pagination.limit,
      offset: pagination.offset,
    });
  }

  @Post(':user_id/games')
  @UseGuards(AuthGuard)
  async importGames(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<GamesImportResultDto> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    return this.gamesImporterService.import(userId, body);
  }

  @Post(':user_id/views')
  @UseGuards(AuthGuard)
  async importViews(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<ViewsImportResultDto> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    return this.viewsImporterService.import(userId, body);
  }

  @Get(':user_id/views/graph')
  @UseGuards(AuthGuard)
  async viewsGraph(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
  ): Promise<ViewsGraphsDto> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    return this.viewsService.getGraph(userId);
  }

  @Get(':user_id/oauth-identity')
  @UseGuards(AuthGuard)
  async oauthIdentity(
    @Req() request: AuthenticatedRequest,
    @Param('user_id') userId: string,
  ): Promise<OauthIdentityDto | null> {
    if (request.user?.id !== userId) {
      throw new ForbiddenException("Cannot access another user's resources");
    }

    return await this.oauthIdentitiesService.find({
      where: eq(schema.oauthIdentitiesTable.user_id, userId),
    });
  }
}
