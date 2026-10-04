import {
  OauthIdentityDto,
  PaginationDto,
  PaymentDto,
  PaymentsFilterDto,
  PaymentsGraphsDto,
  PaymentsImportResultDto,
  PaymentsSummaryDto,
  UserDto,
  UserWithRevenueDto,
} from '@itch/protocol';
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
import { and, eq } from 'drizzle-orm';
import { type AuthenticatedRequest, AuthGuard } from '@/libs/auth';
import { PaymentsImporterService } from '@/libs/itch';
import {
  OAuthIdentitiesService,
  OAuthProvider,
  PaymentsService,
  schema,
  UsersService,
} from '@/libs/shared';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly paymentsService: PaymentsService,
    private readonly paymentsImporterService: PaymentsImporterService,
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
      where: and(
        eq(schema.oauthIdentitiesTable.user_id, userId),
        eq(schema.oauthIdentitiesTable.provider, OAuthProvider.Itch),
      ),
    });
  }
}
