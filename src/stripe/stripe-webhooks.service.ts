import { HttpStatus, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
// import { CheckrService } from '../checkr/checkr.service';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { ProviderSubscriptionTypeEnum } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class StripeWebhooksService {
  stripe: Stripe;
  private stripeWebhookSecret: string;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService, // private checkrService: CheckrService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });

    this.stripeWebhookSecret =
      this.secretService.getStripeCreds().webhookSecret;
  }

  async paymentIntentCreated(paymentIntent: object) {
    const { id, amount, currency, payment_method_types, status, metadata } =
      Object(paymentIntent);

    const { type, userSubscriptionId } = metadata;

    //payment intent created for subscription
    if (type === 'subscription') {
      const userSubscriptions =
        await this.prismaService.userSubscriptions.findFirst({
          where: {
            id: BigInt(userSubscriptionId),
            deletedAt: null,
          },
          include: {
            userSubscriptionInvoices: true,
          },
        });

      throwBadRequestErrorCheck(
        !userSubscriptions,
        'User subscription not found',
      );
      throwBadRequestErrorCheck(
        userSubscriptions?.userSubscriptionInvoices?.piId != id,
        'PI ID does not exists',
      );

      await this.prismaService.userSubscriptionInvoices.update({
        where: {
          id: userSubscriptions?.userSubscriptionInvoices?.id,
        },
        data: {
          status: status,
          total: amount / 100,
          currency: currency,
          src: payment_method_types,
        },
      });
      return {
        message: 'Payment Intent Created',
      };
    }
  }

  async chargeSucceeded(charge: object) {
    const {
      id,
      payment_intent,
      paid,
      status,
      payment_method_details,
      metadata,
    } = Object(charge);

    const { type, userId, userSubscriptionId } = metadata;

    /**
     * Commented out because we are not using Checkr
     */

    // const user = await this.prismaService.user.findFirst({
    //   where: {
    //     id: BigInt(userId),
    //     deletedAt: null,
    //   },
    //   include: {
    //     provider: {
    //       include: {
    //         providerCheckrCandidate: true,
    //       },
    //     },
    //   },
    // });

    if (type === 'subscription') {
      const userSubscriptionInvoices =
        await this.prismaService.userSubscriptionInvoices.findFirst({
          where: {
            piId: payment_intent,
          },
          include: {
            userSubscription: {
              include: {
                subscriptionPlan: true,
              },
            },
          },
        });

      throwBadRequestErrorCheck(
        !userSubscriptionInvoices,
        'User subscription invoice not found',
      );

      await this.prismaService.userSubscriptionInvoices.update({
        where: {
          id: userSubscriptionInvoices?.id,
        },
        data: {
          chargeId: id,
          status: status,
          paid: paid,
          src: payment_method_details,
          billingDate: new Date(),
        },
      });

      await this.prismaService.userSubscriptions.update({
        where: {
          id: userSubscriptionInvoices?.userSubscriptionId,
        },
        data: {
          status: 'active',
          paymentStatus: status,
        },
      });

      let providerSubscriptionType: ProviderSubscriptionTypeEnum;

      if (
        userSubscriptionInvoices?.userSubscription?.subscriptionPlan?.slug ==
        'platinum'
      ) {
        providerSubscriptionType = ProviderSubscriptionTypeEnum['PLATINUM'];
      } else if (
        userSubscriptionInvoices?.userSubscription?.subscriptionPlan?.slug ==
        'gold'
      ) {
        providerSubscriptionType = ProviderSubscriptionTypeEnum['GOLD'];
      }

      await this.prismaService.provider.update({
        where: {
          userId: userSubscriptionInvoices?.userSubscription?.userId,
        },
        data: {
          subscriptionType: providerSubscriptionType,
        },
      });

      /**
       * Commenting checkr code for now
       */
      // Initate background check for 1st time subscription
      // if (!user?.provider?.providerCheckrCandidate &&
      //   user?.provider?.backGroundCheck == 'NONE'
      // ) {
      //   this.checkrService.initiateBackgourndCheck(
      //     user?.id,
      //     providerSubscriptionType,
      //   );
      // }

      return {
        message: 'Charge Succeeded',
      };
    } else if (type == 'default_verification') {
      const userMiscellenous =
        await this.prismaService.miscellaneousPayments.findFirst({
          where: {
            userId: BigInt(userId),
            type: 'DEFAULT_VERIFICATION',
            piId: payment_intent,
          },
        });

      const updateUserMiscellenous =
        await this.prismaService.miscellaneousPayments.update({
          where: {
            id: userMiscellenous?.id,
          },
          data: {
            chargeId: id,
            status: status,
            paid: paid,
            src: payment_method_details,
            billingDate: new Date(),
          },
        });

      /**
       * Commenting checkr code for now
       */

      // await this.prismaService.provider.update({
      //   where: {
      //     userId: BigInt(userId),
      //   },
      //   data: {
      //     backGroundCheck: 'BASIC',
      //   },
      // });

      throwBadRequestErrorCheck(
        !updateUserMiscellenous,
        'Miscellenous payment can not be updated.',
      );

      return {
        message: 'Charge Succeeded',
      };
    }
  }

  async paymentIntentCanceled(paymentIntent: object) {
    const { id, status, metadata } = Object(paymentIntent);

    const { type, userSubscriptionId } = metadata;

    if (type === 'subscription') {
      const userSubscriptions =
        await this.prismaService.userSubscriptions.findFirst({
          where: {
            id: BigInt(userSubscriptionId),
            deletedAt: null,
          },
          include: {
            userSubscriptionInvoices: true,
          },
        });

      throwBadRequestErrorCheck(
        !userSubscriptions,
        'User subscription not found',
      );
      throwBadRequestErrorCheck(
        userSubscriptions?.userSubscriptionInvoices?.piId != id,
        'PI ID does not exists',
      );

      await this.prismaService.userSubscriptionInvoices.update({
        where: {
          id: userSubscriptions?.userSubscriptionInvoices?.id,
        },
        data: {
          status: status,
          billingDate: null,
        },
      });
      return {
        message: 'Payment Intent cancelled',
      };
    }
  }

  async stripeWebhook(stripeSignature: any, body: any) {
    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        stripeSignature,
        this.stripeWebhookSecret,
      );
    } catch (e) {
      console.log(e);
      throw e as Error;
    }

    console.log('Stripe Event', event);

    switch (event.type) {
      case 'charge.succeeded':
        console.log('Charge Succeeded');
        return await this.chargeSucceeded(event.data.object);
      case 'payment_intent.canceled':
        console.log('Payment Intent Canceled');
        return this.paymentIntentCanceled(event.data.object);
      case 'payment_intent.created':
        console.log('Payment Intent Created');
        return this.paymentIntentCreated(event.data.object);
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid event type',
        };
    }
  }
}
