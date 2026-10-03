import { MetricsOverviewDto, PaymentDto, PaymentsImportResultDto } from '@itch/protocol';
import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import { type AuthenticatedRequest, AuthGuard } from '@/libs/auth';
import { PaymentsImporterService } from '@/libs/itch';
import { PaymentsService, schema } from '@/libs/shared';

@ApiTags('me')
@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(
    private readonly paymentsImporterService: PaymentsImporterService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /** Manual sync: user pastes/uploads an itch.io export-purchases CSV. */
  @Post('payments/import')
  async importPayments(
    @Req() request: AuthenticatedRequest,
    @Body() body: { csv?: string },
  ): Promise<PaymentsImportResultDto> {
    if (!body.csv || body.csv.trim().length === 0) {
      throw new BadRequestException('csv payload is required');
    }

    return this.paymentsImporterService.import(request.user.id, body.csv);
  }

  /** Imported itch.io payments (revenue source of truth). */
  @Get('payments')
  async listPayments(@Req() request: AuthenticatedRequest): Promise<PaymentDto[]> {
    const payments = await this.paymentsService.findMany({
      where: eq(schema.paymentsTable.user_id, request.user.id),
      orderBy: schema.paymentsTable.purchased_at,
    });

    return payments.map((payment) => ({
      id: payment.external_id,
      object_name: payment.object_name,
      amount: payment.amount,
      amount_cents: payment.amount_cents,
      currency: payment.currency,
      source: payment.source,
      purchased_at: payment.purchased_at?.toISOString() ?? null,
      donation: payment.donation,
      payout: payment.payout,
    }));
  }
}
