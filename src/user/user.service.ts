import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { SubscriptionPlanSlugs } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class UserService {
  stripe: Stripe;
  constructor(
    private readonly prismaService: PrismaService,
    private secretService: SecretService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });
  }

  async removeUserAccount(userId: bigint) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        provider: {
          include: {
            appointment: {
              where: {
                deletedAt: null,
                OR: [
                  {
                    status: {
                      not: 'COMPLETED',
                    },
                  },
                  {
                    status: {
                      not: 'CANCELLED',
                    },
                  },
                  {
                    status: {
                      not: 'REJECTED',
                    },
                  },
                ],
              },
            },
            appointmentBillingTransactions: {
              where: {
                releaseStatus: false,
                deletedAt: null,
              },
            },
          },
        },
        userSubscriptions: {
          where: {
            deletedAt: null,
            status: 'active',
          },
          include: {
            membershipPlanPrice: {
              include: {
                membershipPlan: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        userStripeCustomerAccount: true,
        appointment: {
          where: {
            deletedAt: null,
            OR: [
              {
                status: {
                  not: 'COMPLETED',
                },
              },
              {
                status: {
                  not: 'CANCELLED',
                },
              },
              {
                status: {
                  not: 'REJECTED',
                },
              },
            ],
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(
      !!user?.provider?.appointment?.length || !!user?.appointment?.length,
      'User has pending Appointment. Please cancel/complete those appointmnet first.',
    );

    throwBadRequestErrorCheck(
      !!user?.provider?.appointmentBillingTransactions?.length,
      'User has pending balance transfer/transactions. Please contact with admin for further instructions.',
    );

    if (
      user?.userSubscriptions[0]?.membershipPlanPrice?.membershipPlan?.slug !=
      SubscriptionPlanSlugs.BASIC
    ) {
      throwBadRequestErrorCheck(
        !!user?.userSubscriptions?.length,
        'User has active subscriptions. Please cancel the subscription first.',
      );
    }

    const newAppleId = !!user?.appleAccountId
      ? `DELETED-${user?.appleAccountId}`
      : null;

    const deletedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        email: `DELETED-${user?.opk}-${user?.email}`,
        appleAccountId: newAppleId,
        deletedAt: new Date(),
      },
    });

    throwBadRequestErrorCheck(!deletedUser, 'User can not be deleted!');

    if (!!user?.provider) {
      await this.prismaService.provider.update({
        where: { id: user?.provider?.id },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    if (user?.userStripeCustomerAccount?.stripeCustomerId) {
      await this.stripe.customers.del(
        user?.userStripeCustomerAccount?.stripeCustomerId,
      );
      await this.prismaService.userStripeCustomerAccount.delete({
        where: {
          userId: user?.id,
        },
      });
    }

    return {
      message: 'User account deleted',
    };
  }
}
