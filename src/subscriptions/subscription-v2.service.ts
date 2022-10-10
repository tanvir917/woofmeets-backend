import { HttpStatus, Injectable } from '@nestjs/common';
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

  async checkIfNeedToPayBasicPayment(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        provider: true,
        userStripeCustomerAccount: true,
        userStripeCard: {
          where: {
            deletedAt: null,
            isDefault: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    throwBadRequestErrorCheck(
      !user?.userStripeCard?.length,
      'No card found. Please add a card.',
    );

    const paymentChecker = await this.checkUserSubsOrSignupPayment(user?.id);

    if (paymentChecker) {
      return {
        message: 'User does not need to pay',
        data: {
          needPayment: false,
        },
      };
    } else {
      return {
        message: 'User needs to pay the one time fee.',
        data: {
          needPayment: true,
        },
      };
    }
  }

  async payBasicPayment(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        provider: true,
        userStripeCustomerAccount: true,
        userStripeCard: {
          where: {
            deletedAt: null,
            isDefault: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    throwBadRequestErrorCheck(
      !user?.userStripeCard?.length,
      'No card found. Please add a card.',
    );

    const paymentChecker = await this.checkUserSubsOrSignupPayment(user?.id);

    if (paymentChecker) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'User does not need to pay',
      };
    } else {
      await this.prismaService.miscellaneousPayments.updateMany({
        where: {
          userId,
          status: 'pending',
        },
        data: {
          deletedAt: new Date(),
        },
      });

      let paymentIntent: Stripe.PaymentIntent;
      try {
        paymentIntent = await this.stripe.paymentIntents.create({
          amount: 35 * 100,
          currency: 'usd',
          payment_method: user?.userStripeCard[0].stripeCardId,
          customer: user?.userStripeCustomerAccount?.stripeCustomerId,
          off_session: true,
          confirm: true,
          metadata: {
            type: 'default_verification',
            userId: user?.id.toString(),
          },
        });

        await this.prismaService.miscellaneousPayments.create({
          data: {
            userId: user?.id,
            piId: paymentIntent?.id,
            total: paymentIntent?.amount / 100,
            currency: paymentIntent?.currency,
            paid: paymentIntent?.status === 'succeeded' ? true : false,
            status: paymentIntent?.status,
            type: 'DEFAULT_VERIFICATION',
            src: paymentIntent?.payment_method_types,
          },
        });

        return {
          message: 'Payment successful',
        };
      } catch (error) {
        throw error as Error;
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

    throwBadRequestErrorCheck(!priceId, 'Price id is required');

    throwBadRequestErrorCheck(!cardId, 'Card id is required');

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

    if (priceObject?.membershipPlan?.slug == SubscriptionPlanSlugs.BASIC) {
      const paymentChecker = await this.checkUserSubsOrSignupPayment(user?.id);
      throwBadRequestErrorCheck(
        !paymentChecker,
        'User needs to pay the fee first.',
      );
    }

    const cancelledSubscription = await this.cancelUserAllActiveSubscriptions(
      user?.id,
    );

    throwBadRequestErrorCheck(
      !cancelledSubscription,
      'Error while cancelling and migrating to new subscription',
    );

    let subscription: Stripe.Subscription;
    let latestInvoice: Stripe.Invoice;
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
      // const stats = subscription['latest_invoice']['payment_intent']['status'];
      // const clientSecret =
      //   subscription['latest_invoice']['payment_intent']['client_secret'];
      latestInvoice = Object(subscription['latest_invoice']);
    } catch (error) {
      throwBadRequestErrorCheck(true, error.message);
    }

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

    await this.prismaService.userSubscriptionInvoices.create({
      data: {
        userId: user?.id,
        userSubscriptionId: userSubscription?.id,
        stripeInvoiceId: latestInvoice?.id,
        customerStripeId: user?.userStripeCustomerAccount?.stripeCustomerId,
        customerEmail: latestInvoice?.customer_email,
        customerName: latestInvoice?.customer_name,
        total: latestInvoice?.total / 100,
        subTotal: latestInvoice?.subtotal / 100,
        amountDue: latestInvoice?.amount_due / 100,
        amountPaid: latestInvoice?.amount_paid / 100,
        amountRemaining: latestInvoice?.amount_remaining / 100,
        billingReason: latestInvoice?.billing_reason,
        currency: latestInvoice?.currency,
        paid: latestInvoice?.paid,
        status: latestInvoice?.status,
        src: Object(latestInvoice),
      },
    });

    if (subscription.status == 'incomplete') {
      const paymentIntent = latestInvoice.payment_intent ?? null;

      if (paymentIntent) {
        const latestPaymentError: Stripe.PaymentIntent.LastPaymentError =
          Object(paymentIntent['last_payment_error']) ?? null;

        if (latestPaymentError) {
          if ((latestPaymentError.type = 'card_error')) {
            await this.stripe.subscriptions.del(subscription.id);

            await this.prismaService.userSubscriptions.update({
              where: {
                id: userSubscription?.id,
              },
              data: {
                errors: Object(latestPaymentError),
              },
            });

            throwBadRequestErrorCheck(
              true,
              'Your card was declined. Plase try with another card or contact your bank.',
            );
          }
        }
      }
    }

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

    // TODO: Check if the subscription required for ANY 3d secure verification.
    // If yes, return the client secret to the frontend. If no, return the subscription object.
    // As in USA and Canada, 3d secure verification is not required. So left for global implementation.
  }

  async getUserCurrentSubscription(userId: bigint) {
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
          select: {
            id: true,
            userId: true,
            cardId: true,
            currency: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            status: true,
            paymentStatus: true,
            meta: true,
            membershipPlanPrice: {
              include: {
                membershipPlan: true,
              },
            },
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(
      !user?.userSubscriptions?.length,
      'No subscription found',
    );

    return {
      message: 'User current subscription.',
      data: {
        subscriptionInfo: user?.userSubscriptions[0],
      },
    };
  }

  async cancelUserSubscription(userId: bigint) {
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
          select: {
            id: true,
            userId: true,
            stripeSubscriptionId: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(
      !user?.userSubscriptions?.length,
      'No subscription found',
    );

    const subscriptions = user?.userSubscriptions;

    for (const subscription of subscriptions) {
      let stripeSubscription: Stripe.Subscription;
      try {
        stripeSubscription = await this.stripe.subscriptions.del(
          subscription.stripeSubscriptionId,
        );
        await this.prismaService.userSubscriptions.update({
          where: {
            id: subscription.id,
          },
          data: {
            status: stripeSubscription.status,
            deletedAt: new Date(),
            src: Object(stripeSubscription),
          },
        });
      } catch (error) {
        throwBadRequestErrorCheck(true, error.message);
      }
    }

    return {
      message: 'Subscription cancelled successfully.',
    };
  }

  /**
   * This function will cancel all active subscriptions of a user.
   * It will be used by the subscription creation function.
   * @param userId
   * @returns true if all subscriptions are cancelled successfully.
   * @returns false if any subscription is not cancelled successfully.
   */

  async cancelUserAllActiveSubscriptions(userId: bigint) {
    const userSubscriptions =
      await this.prismaService.userSubscriptions.findMany({
        where: {
          userId: userId,
          status: 'active',
          deletedAt: null,
        },
      });

    // check if user has any active subscription
    // If no, reuturn true. Because there is no subscription to cancel.
    if (!userSubscriptions.length) {
      return true;
    }

    for (const subscription of userSubscriptions) {
      let stripeSubscription: Stripe.Subscription;
      try {
        stripeSubscription = await this.stripe.subscriptions.del(
          subscription.stripeSubscriptionId,
        );
        await this.prismaService.userSubscriptions.update({
          where: {
            id: subscription.id,
          },
          data: {
            status: stripeSubscription.status,
            deletedAt: new Date(),
            src: Object(stripeSubscription),
          },
        });
      } catch (error) {
        return false;
      }
    }

    return true;
  }
}
