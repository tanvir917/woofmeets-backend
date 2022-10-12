import { HttpStatus, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';

@Injectable()
export class StripeConnectWebhooksService {
  stripe: Stripe;
  private stripeConnectWebhookSecret: string;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });

    this.stripeConnectWebhookSecret =
      this.secretService.getStripeCreds().connectWebhookSecret;
  }

  private async handleAccontUpdated(account: object) {
    const {
      id,
      charges_enabled,
      payouts_enabled,
      details_submitted,
      requirements,
      type,
      future_requirements,
      capabilities,
      country,
      default_currency,
      email,
    } = Object(account);

    const stripeAccount =
      await this.prismaService.userStripeConnectAccount.findFirst({
        where: {
          stripeAccountId: id,
          deletedAt: null,
        },
      });

    throwBadRequestErrorCheck(!stripeAccount, 'Account not found!');

    const accountUpdated =
      await this.prismaService.userStripeConnectAccount.update({
        where: { id: stripeAccount?.id },
        data: {
          country: country,
          defaultCurrency: default_currency,
          chargesEnabled: charges_enabled,
          payoutsEnabled: payouts_enabled,
          detailsSubmitted: details_submitted,
          requirements: requirements,
          futureRequirements: future_requirements,
          capabilities: capabilities,
          email,
          type,
        },
      });

    throwBadRequestErrorCheck(!accountUpdated, 'Account can not be updated!');

    return {
      message: 'Account Updated!',
    };
  }

  async stripeConnectWebhook(stripeSignature: any, body: any) {
    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        stripeSignature,
        this.stripeConnectWebhookSecret,
      );
    } catch (e) {
      console.log(e);
      throwBadRequestErrorCheck(true, e.message);
    }

    // console.log('Stripe Event', event);

    switch (event.type) {
      case 'account.updated':
        return this.handleAccontUpdated(event.data.object);
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid event type',
        };
    }
  }
}
