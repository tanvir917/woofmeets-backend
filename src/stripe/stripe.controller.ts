import {
  Controller,
  Post,
  Headers,
  Req,
  UseInterceptors,
  UseGuards,
  Request,
  Query,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';
import { StripeConnectWebhooksService } from './stripe-connect-webhooks.service';
import { StripeWebhooksService } from './stripe-webhooks.service';
import { StripeService } from './stripe.service';

@ApiTags('Stripe')
@UseInterceptors(TransformInterceptor)
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeWebhookService: StripeWebhooksService,
    private readonly stripeConnectWebhookService: StripeConnectWebhooksService,
    private readonly stripeService: StripeService,
  ) {}

  @ApiOperation({
    summary: 'Only Stripe will use this api for sending their webhook events!',
  })
  @Post('webhooks')
  async handleWebhook(
    @Headers('stripe-signature') signature: any,
    @Req() request: any,
  ) {
    return this.stripeWebhookService.stripeWebhook(signature, request.rawBody);
  }

  @ApiOperation({
    summary:
      'Only Stripe will use this api for sending their webhook for Stripe connect events!',
  })
  @Post('connect-webhooks')
  async handleConnectWebhook(
    @Headers('stripe-signature') signature: any,
    @Req() request: any,
  ) {
    return this.stripeConnectWebhookService.stripeConnectWebhook(
      signature,
      request.rawBody,
    );
  }

  @ApiOperation({
    deprecated: true,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('test-payment')
  async testStripePayment(
    @Request() req: any,
    // @Query('card') card: string,
    @Query('idemKey') idemKey: string,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.stripeService.testStripePaymentIntentCreate(
      userId,
      // BigInt(card),
      idemKey,
    );
  }
}
