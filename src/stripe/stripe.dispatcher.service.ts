import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import Stripe from 'stripe';
import { SecretService } from '../secret/secret.service';

export class CustomStripeRefundParams {
  amountInDollars: number;
  chargeId: string;
  // customerKey: string;
  cancellation_reason: Stripe.RefundCreateParams.Reason =
    'requested_by_customer';
  metadata?: any;
}

type RefundDispatcherResultType = {
  success: boolean;
  state?: string;
  result: Stripe.Refund | null;
  error: any;
};

@Injectable()
export class StripeDispatcherService {
  stripe: Stripe;
  constructor(
    private secretService: SecretService,
    private readonly logger: PinoLogger,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });
    this.logger.setContext(StripeDispatcherService.name);
  }

  async refundDispatcher(
    data: CustomStripeRefundParams,
  ): Promise<RefundDispatcherResultType> {
    try {
      const refund: Stripe.Refund = await this.stripe.refunds.create({
        amount: Math.round(data?.amountInDollars * 100),
        charge: data?.chargeId,
        reason: data?.cancellation_reason,
        metadata: data?.metadata,
      });

      this.logger.info(refund);

      return {
        success: refund?.status == 'succeeded' || refund?.status == 'pending',
        state: refund?.status,
        result: refund,
        error: null,
      };
    } catch (error) {
      this.logger.error(error);
      return {
        success: false,
        result: null,
        error: error,
      };
    }
  }
}
