import {
  Controller,
  Post,
  Headers,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../transform.interceptor';
import { StripeWebhooksService } from './stripe-webhooks.service';

@ApiTags('Stripe')
@UseInterceptors(TransformInterceptor)
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeWebhookService: StripeWebhooksService) {}

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
}
