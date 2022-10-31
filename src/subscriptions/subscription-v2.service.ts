import { HttpStatus, Injectable } from '@nestjs/common';
import {
  UserStripeCard,
  UserSubscriptions,
  userSubscriptionStatusEnum,
} from '@prisma/client';
import Stripe from 'stripe';
import { AdminPanelService } from '../admin-panel/admin-panel.service';
import {
  throwBadRequestErrorCheck,
  throwUnauthorizedErrorCheck,
} from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { CreateSubscriptionQueryDto } from './dto/create-subscription.dto';
import {
  SubscriptionListsForUserQueryParamsDto,
  SubscriptionListsQueryParamsDto,
} from './dto/subscription-list-query-params.dto';
import {
  ProviderBackgourndCheckEnum,
  ProviderSubscriptionTypeEnum,
  SubscriptionPlanSlugs,
  SubscriptionStatusEnum,
} from './entities/subscription.entity';

@Injectable()
export class SubscriptionV2Service {
  stripe: Stripe;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
    private adminPanelService: AdminPanelService,
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

  async payBasicPayment(userId: bigint, cardId: bigint) {
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
            id: cardId,
            deletedAt: null,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    throwBadRequestErrorCheck(
      !user?.userStripeCard?.length,
      'No card found. Please check again or try with another card.',
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

        if (paymentIntent?.status === 'succeeded') {
          await this.prismaService.provider.update({
            where: {
              id: user?.provider?.id,
            },
            data: {
              backGroundCheck: ProviderBackgourndCheckEnum.BASIC,
            },
          });
        }

        return {
          message: 'Payment successful',
        };
      } catch (error) {
        throwBadRequestErrorCheck(true, error.message);
      }
    }
  }

  async payBasicPaymentV2(
    userId: bigint,
    cardId: bigint,
    idempontencyKey: string,
  ) {
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
            id: cardId,
            deletedAt: null,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    throwBadRequestErrorCheck(
      !user?.userStripeCard?.length,
      'No card found. Please check again or try with another card.',
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
        paymentIntent = await this.stripe.paymentIntents.create(
          {
            amount: 35 * 100,
            currency: 'usd',
            payment_method: user?.userStripeCard[0].stripeCardId,
            customer: user?.userStripeCustomerAccount?.stripeCustomerId,
            confirm: true,
            metadata: {
              type: 'default_verification',
              userId: user?.id.toString(),
            },
          },
          { idempotencyKey: idempontencyKey },
        );
      } catch (error) {
        if (error?.code == 'idempotency_key_in_use') {
          return {
            statusCode: 409,
            message: 'Idempotency key already in use',
            data: {
              status: 'idempotency_key_in_use',
            },
          };
        }
        throwBadRequestErrorCheck(true, error?.message);
      }

      const prevMiscellaneousPayment =
        await this.prismaService.miscellaneousPayments.findFirst({
          where: {
            piId: paymentIntent?.id,
          },
        });

      if (prevMiscellaneousPayment) {
        if (prevMiscellaneousPayment?.status === 'succeeded') {
          throwBadRequestErrorCheck(true, 'Payment already done');
        } else {
          throwBadRequestErrorCheck(true, 'Payment failed. Please try again.');
        }
      }

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

      if (paymentIntent?.status === 'succeeded') {
        await this.prismaService.provider.update({
          where: {
            id: user?.provider?.id,
          },
          data: {
            backGroundCheck: ProviderBackgourndCheckEnum.BASIC,
          },
        });
        return {
          message: 'Payment successful',
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
  }

  async updateBackgroundCheckStatus(
    providerId: bigint,
    status: ProviderBackgourndCheckEnum,
  ) {
    await this.prismaService.provider.update({
      where: {
        id: providerId,
      },
      data: {
        backGroundCheck: status,
      },
    });
    return true;
  }

  async createSubscriptionV2(
    userId: bigint,
    query: CreateSubscriptionQueryDto,
  ) {
    const { priceId, cardId } = query;
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

    let card: UserStripeCard;

    if (priceObject?.membershipPlan?.slug != SubscriptionPlanSlugs.BASIC) {
      throwBadRequestErrorCheck(!cardId, 'Card id is required');

      card = await this.prismaService.userStripeCard.findFirst({
        where: {
          id: cardId,
          deletedAt: null,
          userId: userId,
        },
      });

      throwBadRequestErrorCheck(!card, 'Card not found');
    }

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

    // If user has an active subscription cancel the subscription
    const cancelledSubscription = await this.cancelUserAllActiveSubscriptions(
      user?.id,
    );

    throwBadRequestErrorCheck(
      !cancelledSubscription,
      'Error while cancelling and migrating to new subscription',
    );

    /**
     * If the user selected a basic subscription plan, check if the user is eligible for payment
     */

    let userSubscription: UserSubscriptions;

    // For Basic Subscription
    if (priceObject?.membershipPlan?.slug == SubscriptionPlanSlugs.BASIC) {
      const paymentChecker = await this.checkUserSubsOrSignupPayment(user?.id);
      throwBadRequestErrorCheck(
        !paymentChecker,
        'User needs to pay the fee first.',
      );

      const endDate: Date = new Date();
      endDate.setMonth(endDate.getMonth() + 60);

      userSubscription = await this.prismaService.userSubscriptions.create({
        data: {
          userId: user.id,
          membershipPlanPriceId: priceObject.id,
          status: SubscriptionStatusEnum.active,
          paymentStatus: 'paid',
          currentPeriodStart: new Date(),
          currentPeriodEnd: endDate,
          currency: 'usd',
        },
      });
    } else {
      // For Gold and Platinum Subscription
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

      userSubscription = await this.prismaService.userSubscriptions.create({
        data: {
          userId: user.id,
          membershipPlanPriceId: priceObject.id,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          paymentStatus: latestInvoice?.status,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000,
          ),
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

      /**
       * LOGIC:
       * 1.Check if user has an active subscription.
       * 2.Check if the subscription plan is platinum. If yes, check if background check is not
       *    platinum. If yes, create a background platinum check.
       * 3.If subscription plan is Gold, check if background check is not gold or platinum. If yes,
       *   create a gold background check.
       */

      if (subscription.status == SubscriptionStatusEnum.active) {
        if (
          user?.provider.backGroundCheck !=
            ProviderBackgourndCheckEnum.PLATINUM &&
          priceObject?.membershipPlan?.slug == SubscriptionPlanSlugs.PLATINUM
        ) {
          await this.updateBackgroundCheckStatus(
            user?.provider?.id,
            ProviderBackgourndCheckEnum.PLATINUM,
          );
        } else if (
          user?.provider?.backGroundCheck != ProviderBackgourndCheckEnum.GOLD &&
          user?.provider?.backGroundCheck !=
            ProviderBackgourndCheckEnum.PLATINUM &&
          priceObject?.membershipPlan?.slug == SubscriptionPlanSlugs.GOLD
        ) {
          await this.updateBackgroundCheckStatus(
            user?.provider?.id,
            ProviderBackgourndCheckEnum.GOLD,
          );
        }
      }
    }

    await this.prismaService.provider.update({
      where: {
        id: user?.provider?.id,
      },
      data: {
        subscriptionType:
          priceObject?.membershipPlan?.slug?.toUpperCase() as ProviderSubscriptionTypeEnum,
      },
    });

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

  /**
   * TODO: Subscription needs 3Ds verification.
   */
  async createSubscriptionV3(
    userId: bigint,
    query: CreateSubscriptionQueryDto,
    idempotencyKey: string,
  ) {
    const { priceId, cardId } = query;
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

    let card: UserStripeCard;

    if (priceObject?.membershipPlan?.slug != SubscriptionPlanSlugs.BASIC) {
      throwBadRequestErrorCheck(!cardId, 'Card id is required');

      card = await this.prismaService.userStripeCard.findFirst({
        where: {
          id: cardId,
          deletedAt: null,
          userId: userId,
        },
      });

      throwBadRequestErrorCheck(!card, 'Card not found');
    }

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

    let userSubscription: UserSubscriptions;

    // For Basic Subscription
    if (priceObject?.membershipPlan?.slug == SubscriptionPlanSlugs.BASIC) {
      // If user has an active subscription cancel the subscription
      const cancelledSubscription = await this.cancelUserAllActiveSubscriptions(
        user?.id,
      );

      throwBadRequestErrorCheck(
        !cancelledSubscription,
        'Error while cancelling and migrating to new subscription',
      );

      const paymentChecker = await this.checkUserSubsOrSignupPayment(user?.id);
      throwBadRequestErrorCheck(
        !paymentChecker,
        'User needs to pay the fee first.',
      );

      const endDate: Date = new Date();
      endDate.setMonth(endDate.getMonth() + 60);

      userSubscription = await this.prismaService.userSubscriptions.create({
        data: {
          userId: user.id,
          membershipPlanPriceId: priceObject.id,
          status: SubscriptionStatusEnum.active,
          paymentStatus: 'paid',
          currentPeriodStart: new Date(),
          currentPeriodEnd: endDate,
          currency: 'usd',
        },
      });
    } else {
      // For Gold and Platinum Subscription
      let subscription: Stripe.Subscription;
      let latestInvoice: Stripe.Invoice;
      try {
        subscription = await this.stripe.subscriptions.create(
          {
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
          },
          { idempotencyKey: idempotencyKey },
        );
        // const stats = subscription['latest_invoice']['payment_intent']['status'];
        // const clientSecret =
        //   subscription['latest_invoice']['payment_intent']['client_secret'];
        latestInvoice = Object(subscription['latest_invoice']);
      } catch (error) {
        if (error?.code == 'idempotency_key_in_use') {
          return {
            statusCode: 409,
            message: 'Idempotency key already in use',
            data: {
              status: 'idempotency_key_in_use',
            },
          };
        }
        throwBadRequestErrorCheck(true, error?.message);
      }

      const prevSubscription =
        await this.prismaService.userSubscriptions.findFirst({
          where: {
            stripeSubscriptionId: subscription.id,
          },
        });

      throwBadRequestErrorCheck(
        !!prevSubscription,
        'Subscription already exists with same key. Please try again.',
      );

      // If user has previous active subscription cancel the subscription
      await this.cancelUserAllActiveSubscriptions(user?.id);

      userSubscription = await this.prismaService.userSubscriptions.create({
        data: {
          userId: user.id,
          membershipPlanPriceId: priceObject.id,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          paymentStatus: latestInvoice?.status,
          currentPeriodStart: new Date(
            subscription.current_period_start * 1000,
          ),
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

      /**
       * LOGIC:
       * 1.Check if user has an active subscription.
       * 2.Check if the subscription plan is platinum. If yes, check if background check is not
       *    platinum. If yes, create a background platinum check.
       * 3.If subscription plan is Gold, check if background check is not gold or platinum. If yes,
       *   create a gold background check.
       */

      if (subscription.status == SubscriptionStatusEnum.active) {
        if (
          user?.provider.backGroundCheck !=
            ProviderBackgourndCheckEnum.PLATINUM &&
          priceObject?.membershipPlan?.slug == SubscriptionPlanSlugs.PLATINUM
        ) {
          await this.updateBackgroundCheckStatus(
            user?.provider?.id,
            ProviderBackgourndCheckEnum.PLATINUM,
          );
        } else if (
          user?.provider?.backGroundCheck != ProviderBackgourndCheckEnum.GOLD &&
          user?.provider?.backGroundCheck !=
            ProviderBackgourndCheckEnum.PLATINUM &&
          priceObject?.membershipPlan?.slug == SubscriptionPlanSlugs.GOLD
        ) {
          await this.updateBackgroundCheckStatus(
            user?.provider?.id,
            ProviderBackgourndCheckEnum.GOLD,
          );
        }
      }
    }

    await this.prismaService.provider.update({
      where: {
        id: user?.provider?.id,
      },
      data: {
        subscriptionType:
          priceObject?.membershipPlan?.slug?.toUpperCase() as ProviderSubscriptionTypeEnum,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { src, ...userSubscriptionWithoutSrc } = userSubscription;

    return {
      message: 'Subscription created successfully.',
      data: {
        paymentRedirect: false,
        subscriptionInfo: {
          ...userSubscriptionWithoutSrc,
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
        provider: true,
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
        subscriptionType: user?.provider?.subscriptionType,
        subscriptionInfo: user?.userSubscriptions[0],
      },
    };
  }

  async cancelUserSubscription(userId: bigint, subscriptionId: bigint) {
    throwBadRequestErrorCheck(!subscriptionId, 'Subscription id is required');

    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    const userSubscription =
      await this.prismaService.userSubscriptions.findFirst({
        where: {
          id: subscriptionId,
          userId: user?.id,
          status: 'active',
        },
        include: {
          membershipPlanPrice: {
            include: {
              membershipPlan: true,
            },
          },
        },
      });

    throwBadRequestErrorCheck(!userSubscription, 'No subscription found');

    if (
      userSubscription?.membershipPlanPrice?.membershipPlan?.slug ==
      SubscriptionPlanSlugs.BASIC
    ) {
      throwBadRequestErrorCheck(true, 'You can not cancel basic subscription.');
    } else {
      let stripeSubscription: Stripe.Subscription;
      try {
        stripeSubscription = await this.stripe.subscriptions.del(
          userSubscription.stripeSubscriptionId,
        );
        await this.prismaService.userSubscriptions.update({
          where: {
            id: userSubscription.id,
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

      return {
        message: 'Subscription cancelled successfully.',
      };
    }
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
      if (subscription?.stripeSubscriptionId) {
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
      } else {
        await this.prismaService.userSubscriptions.update({
          where: {
            id: subscription.id,
          },
          data: {
            status: SubscriptionStatusEnum.canceled,
            deletedAt: new Date(),
          },
        });
      }
    }

    return true;
  }

  async getSubscriptionLists(
    userId: bigint,
    query: SubscriptionListsQueryParamsDto,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    let { page, limit, sortBy, sortOrder } = query;
    const { status } = query;
    const orderbyObj = {};

    const statusQuery = status
      ? { status: userSubscriptionStatusEnum[status] }
      : {};
    if (!page || page < 1) page = 1;
    if (!limit) limit = 20;
    if (!sortOrder && sortOrder != 'asc' && sortOrder != 'desc')
      sortOrder = 'desc';
    if (!sortBy) sortBy = 'createdAt';

    orderbyObj[sortBy] = sortOrder;
    console.log(orderbyObj);

    const [count, subscriptions] = await this.prismaService.$transaction([
      this.prismaService.userSubscriptions.findMany({
        where: {
          ...statusQuery,
        },
        orderBy: orderbyObj,
      }),

      this.prismaService.userSubscriptions.findMany({
        where: {
          ...statusQuery,
        },
        select: {
          id: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          currency: true,
          status: true,
          paymentStatus: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              image: true,
            },
          },
          membershipPlanPrice: {
            include: {
              membershipPlan: true,
            },
          },
          card: {
            select: {
              id: true,
              brand: true,
              last4: true,
              expMonth: true,
              expYear: true,
            },
          },
          userSubscriptionInvoices: {
            select: {
              id: true,
              userId: true,
              userSubscriptionId: true,
              customerName: true,
              total: true,
              subTotal: true,
              amountDue: true,
              amountPaid: true,
              amountRemaining: true,
              currency: true,
              status: true,
              billingDate: true,
              meta: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: orderbyObj,
      }),
    ]);

    throwBadRequestErrorCheck(
      !count.length || !subscriptions.length,
      'No subscription found.',
    );

    return {
      message: 'Subscription lists.',
      data: subscriptions,
      meta: { total: count.length, currentPage: page, limit },
    };
  }

  async getUserSubscriptionLists(
    userId: bigint,
    query: SubscriptionListsForUserQueryParamsDto,
  ) {
    let { page, limit, sortBy, sortOrder } = query;
    const orderbyObj = {};

    if (!page || page < 1) page = 1;
    if (!limit) limit = 20;
    if (!sortOrder && sortOrder != 'asc' && sortOrder != 'desc')
      sortOrder = 'desc';
    if (!sortBy) sortBy = 'createdAt';

    orderbyObj[sortBy] = sortOrder;

    const [count, subscriptions] = await this.prismaService.$transaction([
      this.prismaService.userSubscriptions.findMany({
        where: {
          userId: userId,
          paymentStatus: 'paid',
        },
        select: {
          id: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          currency: true,
          status: true,
          paymentStatus: true,
          membershipPlanPrice: {
            include: {
              membershipPlan: true,
            },
          },
          card: {
            select: {
              id: true,
              brand: true,
              last4: true,
              expMonth: true,
              expYear: true,
            },
          },
          userSubscriptionInvoices: {
            where: {
              paid: true,
            },
            select: {
              id: true,
              userId: true,
              userSubscriptionId: true,
              customerName: true,
              total: true,
              subTotal: true,
              amountDue: true,
              amountPaid: true,
              amountRemaining: true,
              currency: true,
              status: true,
              billingDate: true,
              meta: true,
            },
          },
        },
        orderBy: orderbyObj,
      }),
      this.prismaService.userSubscriptions.findMany({
        where: {
          userId: userId,
          paymentStatus: 'paid',
        },
        select: {
          id: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          currency: true,
          status: true,
          paymentStatus: true,
          membershipPlanPrice: {
            include: {
              membershipPlan: true,
            },
          },
          card: {
            select: {
              id: true,
              brand: true,
              last4: true,
              expMonth: true,
              expYear: true,
            },
          },
          userSubscriptionInvoices: {
            where: {
              paid: true,
            },
            select: {
              id: true,
              userId: true,
              stripeInvoiceId: true,
              userSubscriptionId: true,
              customerName: true,
              total: true,
              subTotal: true,
              amountDue: true,
              amountPaid: true,
              amountRemaining: true,
              currency: true,
              status: true,
              billingDate: true,
              meta: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: orderbyObj,
      }),
    ]);

    throwBadRequestErrorCheck(!subscriptions.length, 'No subscription found.');

    return {
      message: 'Subscription lists.',
      data: subscriptions,
      meta: {
        total: count.length,
        currentPage: page,
        limit,
      },
    };
  }
}
