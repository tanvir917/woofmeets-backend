import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { SubscriptionPlanSlugs } from './entities/subscription.entity';

@Injectable()
export class SubscriptionV2Service {
  stripe: Stripe;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });
  }

  async checkUserSubsOrSignupPayment(userId: bigint) {
    const subsPlan = (
      await this.prismaService.membershipPlan.findMany({
        where: {
          OR: [
            {
              slug: SubscriptionPlanSlugs.GOLD,
            },
            {
              slug: SubscriptionPlanSlugs.PLATINUM,
            },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      })
    ).map((plan) => plan.id);

    const subs = await this.prismaService.userSubscriptions.findMany({
      where: {
        userId,
        paymentStatus: 'succeeded',
        membershipPlanPrice: {
          membershipPlanId: {
            in: subsPlan,
          },
        },
        userSubscriptionInvoices: {
          some: {
            paid: true,
            status: 'paid',
          },
        },
      },
    });

    if (subs?.length) {
      return true;
    } else {
      const miscellaneous =
        await this.prismaService.miscellaneousPayments.findFirst({
          where: {
            userId,
            status: 'succeeded',
            paid: true,
            type: 'DEFAULT_VERIFICATION',
          },
        });
      if (miscellaneous || miscellaneous != null) {
        return true;
      } else {
        return false;
      }
    }
  }

  async createSubscriptionV2(userId: bigint, priceId: bigint, cardId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        userSubscriptions: {
          where: {
            status: 'active',
          },
          include: {
            membershipPlanPrice: {
              include: {
                membershipPlan: true,
              },
            },
          },
        },
        userStripeCustomerAccount: true,
        provider: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    const priceObject = await this.prismaService.membershipPlanPrices.findFirst(
      {
        where: {
          id: priceId,
          deletedAt: null,
        },
        include: {
          membershipPlan: true,
        },
      },
    );

    throwBadRequestErrorCheck(!priceObject, 'Price not found');

    const card = await this.prismaService.userStripeCard.findFirst({
      where: {
        id: cardId,
        deletedAt: null,
        userId: userId,
      },
    });

    throwBadRequestErrorCheck(!card, 'Card not found');

    /**
     * LOGIC:
     * 1. Check if user has an active subscription which is not basic. If yes, prevent user from subscribing to a new plan until they cancel the current plan.
     * 2. If user has an active subscription which is basic, cancel the subscription and create a new one.
     * 3. If the user chooses a basic plan for their first subscription, charge them 35$ and create the subscription.
     */

    /**
     * Check if user has an active subscription
     * If yes, check if the subscription plan is not basic
     */
    throwBadRequestErrorCheck(
      user?.userSubscriptions?.length &&
        user?.userSubscriptions[0]?.membershipPlanPrice?.membershipPlan?.slug !=
          SubscriptionPlanSlugs.BASIC,
      'User already have a subscription. Please cancel the existing subscription to continue.',
    );

    /**
     * Check if user has an active subscription
     * If yes, check if inputted subscription plan and active subscription plan are
     * both basic subscription plans.
     */
    throwBadRequestErrorCheck(
      user?.userSubscriptions[0]?.membershipPlanPrice?.membershipPlan?.slug ==
        SubscriptionPlanSlugs.BASIC &&
        priceObject?.membershipPlan?.slug == SubscriptionPlanSlugs.BASIC,
      'User already have basic subscription. Please upgrade subscription plan to continue.',
    );

    /**
     * If the user selected a basic subscription plan, check if the user is eligible for payment
     */

    let subscription: Stripe.Subscription;
    try {
      subscription = await this.stripe.subscriptions.create({
        customer: user.userStripeCustomerAccount?.stripeCustomerId,
        default_payment_method: card.stripeCardId,
        items: [
          {
            price: priceObject.stripePriceId,
          },
        ],
        currency: 'usd',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id.toString(),
          priceId: priceObject.id.toString(),
        },
      });
    } catch (error) {
      throwBadRequestErrorCheck(true, error.message);
    }

    const stats = subscription['latest_invoice']['payment_intent']['status'];
    const clientSecret =
      subscription['latest_invoice']['payment_intent']['client_secret'];
    const latestInvoice = Object(subscription['latest_invoice']);

    const userSubscription = await this.prismaService.userSubscriptions.create({
      data: {
        userId: user.id,
        membershipPlanPriceId: priceObject.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        paymentStatus: latestInvoice?.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cardId: card.id,
        currency: subscription.currency,
        src: Object(subscription),
      },
    });

    // TODO: Check if the subscription required for ANY 3d secure verification.
    // If yes, return the client secret to the frontend. If no, return the subscription object.
    // As in USA and Canada, 3d secure verification is not required. So left for global implementation.

    if (priceObject?.membershipPlan?.slug == SubscriptionPlanSlugs.BASIC) {
      const paymentChecker = await this.checkUserSubsOrSignupPayment(user?.id);
      if (!paymentChecker) {
        let paymentIntent: Stripe.PaymentIntent;
        try {
          paymentIntent = await this.stripe.paymentIntents.create({
            amount: 35 * 100,
            currency: 'usd',
            metadata: {
              type: 'default_verification',
              userId: user?.id.toString(),
              userSubscriptionId: `${userSubscription?.id}`,
            },
          });
        } catch (error) {
          await this.prismaService.userSubscriptions.update({
            where: { id: userSubscription?.id },
            data: {
              deletedAt: new Date(),
              paymentStatus: 'failed',
              meta: {
                reason: 'Payment intent creation failed.',
              },
            },
          });
          throwBadRequestErrorCheck(true, 'Subscription creation failed.');
          await this.prismaService.miscellaneousPayments.create({
            data: {
              userId: user?.id,
              piId: paymentIntent?.id,
              total: paymentIntent?.amount / 100,
              currency: paymentIntent?.currency,
              paid: false,
              status: 'pending',
              type: 'DEFAULT_VERIFICATION',
              src: paymentIntent?.payment_method_types,
            },
          });
          return {
            message: 'Subscription created successfully.',
            data: {
              paymentRedirect: true,
              clientSecret: paymentIntent?.client_secret,
              subscriptionInfo: {
                ...userSubscription,
                subscriptionPlan: priceObject,
              },
            },
          };
        }
      }
    } else {
      return {
        message: 'Subscription created successfully.',
        data: {
          paymentRedirect: false,
          subscriptionInfo: {
            ...userSubscription,
            subscriptionPlan: priceObject,
          },
        },
      };
    }
  }
}
