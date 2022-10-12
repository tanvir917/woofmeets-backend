import {
  Controller,
  Post,
  Headers,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../transform.interceptor';
import { StripeConnectWebhooksService } from './stripe-connect-webhooks.service';
import { StripeWebhooksService } from './stripe-webhooks.service';

@ApiTags('Stripe')
@UseInterceptors(TransformInterceptor)
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeWebhookService: StripeWebhooksService,
    private readonly stripeConnectWebhookService: StripeConnectWebhooksService,
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
}
