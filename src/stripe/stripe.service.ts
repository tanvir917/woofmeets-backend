import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';

@Injectable()
export class StripeService {
  stripe: Stripe;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });
  }

  async stripePaymentIntentCreate(
    userId: bigint,
    cardId: bigint,
    appintmentId: bigint,
    currency: string,
    idempontencyKey: string,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        userStripeCustomerAccount: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    const card = await this.prismaService.userStripeCard.findFirst({
      where: {
        id: cardId,
        userId: userId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!card, 'Card not found');

    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        id: appintmentId,
        userId: userId,
        deletedAt: null,
      },
      include: {
        appointmentProposal: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    throwBadRequestErrorCheck(!appointment, 'Appointment not found');

    const appointmentProposal = appointment?.appointmentProposal[0];

    throwBadRequestErrorCheck(
      !appointmentProposal,
      'Appointment proposal not found',
    );

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: appointmentProposal?.totalPrice * 100,
          currency: currency ?? 'usd',
          payment_method: card?.stripeCardId,
          customer: user?.userStripeCustomerAccount?.stripeCustomerId,
          off_session: true,
          confirm: true,
          metadata: {
            type: 'appointment_payment',
            appointmentId: appointment?.id.toString(),
          },
        },
        {
          idempotencyKey: idempontencyKey,
        },
      );

      if (paymentIntent?.status === 'succeeded') {
        return {
          success: true,
          message: 'Payment successful',
          data: paymentIntent,
        };
      }
    } catch (error) {
      console.log(error);
    }
  }

  async testStripePaymentIntentCreate(
    userId: bigint,
    // cardId: bigint,
    idempontencyKey: string,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        userStripeCustomerAccount: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    // const card = await this.prismaService.userStripeCard.findFirst({
    //   where: {
    //     id: cardId,
    //     userId: userId,
    //     deletedAt: null,
    //   },
    // });

    // throwBadRequestErrorCheck(!card, 'Card not found');

    // console.log(card);

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: 10 * 100,
          currency: 'usd',
          // payment_method: card?.stripeCardId,
          payment_method: 'pm_card_visa_chargeDeclined',
          customer: user?.userStripeCustomerAccount?.stripeCustomerId,
          confirm: true,
        },
        {
          idempotencyKey: idempontencyKey,
        },
      );
    } catch (error) {
      console.log('In catch!');
      throwBadRequestErrorCheck(true, error.message);
    }

    if (paymentIntent?.status === 'succeeded') {
      return {
        message: 'Payment successful.',
        data: {
          requiresAction: false,
        },
      };
    } else if (paymentIntent?.status === 'requires_action') {
      return {
        message: 'Payment requires action.',
        data: {
          requiresAction: true,
          clientSecret: paymentIntent?.client_secret,
        },
      };
    }

    throwBadRequestErrorCheck(true, 'Payment failed.');
  }

  async testSubscription() {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: 'cus_MYcZG3dI2fAFhz',
        default_payment_method: 'card_1LpVKzA5TPHLi30yU2A3jEF1',
        items: [{ price: 'plan_Lg4YxpLO7PLRko' }],
        expand: ['latest_invoice.payment_intent'],
      });
      console.log(subscription);
      return {
        message: 'Subscription successful.',
        data: subscription,
      };
    } catch (error) {
      console.log(error);
      throw error as Error;
    }
  }
}
