import { HttpStatus, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { UserOnboardingRefreshUrlDto } from './dto/create-stripe-connect.dto';

@Injectable()
export class StripeConnectService {
  stripe: Stripe;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });
  }

  async checkUserOnboardStatus(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        userStripeConnectAccount: true,
      },
    });
    console.log(user);
    throwBadRequestErrorCheck(!user, 'No user found!');

    throwBadRequestErrorCheck(
      !user?.userStripeConnectAccount || user?.userStripeConnectAccount == null,
      'User is not onboarded to stripe connect platform!',
    );

    return {
      message: 'User onboarded to stripe connect platform!',
      data: { userStripeConnectAccount: user?.userStripeConnectAccount },
    };
  }

  async onboardUser(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        userStripeConnectAccount: true,
        basicInfo: {
          include: {
            country: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'No user found!');

    throwBadRequestErrorCheck(
      !user?.basicInfo,
      'User needs to add basic info!',
    );

    if (user?.userStripeConnectAccount?.stripeAccountId) {
      return {
        message:
          'user onboardeding already initiated! Please use refresh url if you have not yet onboarded.',
        data: {
          alreadyInitiated: true,
        },
      };
    }

    try {
      const countryCode = user?.basicInfo?.country?.alpha2.toUpperCase();
      const isUS = countryCode === 'US';
      const tosAcceptance = isUS
        ? {}
        : { tos_acceptance: { service_agreement: 'recipient' } };
      const capabilities = isUS
        ? {
            capabilities: {
              transfers: { requested: true },
              card_payments: {
                requested: true,
              },
            },
          }
        : {
            capabilities: {
              transfers: { requested: true },
            },
          };

      const account: Stripe.Account = await this.stripe.accounts.create({
        type: 'express',
        email: user?.email,
        country: countryCode,
        ...capabilities,
        business_type: 'individual',
        settings: {
          payouts: {
            schedule: {
              interval: 'daily',
            },
          },
        },
        ...tosAcceptance,
      });

      throwBadRequestErrorCheck(
        !account,
        'Account can not be created! Please try again after sometime',
      );

      const userStripe =
        await this.prismaService.userStripeConnectAccount.create({
          data: {
            userId: user?.id,
            email: user?.email,
            stripeAccountId: account?.id,
            country: account?.country,
            defaultCurrency: account?.default_currency,
            detailsSubmitted: account?.details_submitted,
            chargesEnabled: account?.charges_enabled,
            payoutsEnabled: account?.payouts_enabled,
            capabilities: Object(account?.capabilities),
            requirements: Object(account?.requirements),
            futureRequirements: Object(account?.future_requirements),
            type: account?.type,
          },
        });

      throwBadRequestErrorCheck(
        !userStripe,
        'Account can not be associated! Please try again after sometime',
      );

      const accountLink = await this.stripe.accountLinks.create({
        account: account?.id,
        refresh_url: `${
          this.secretService.getStripeCreds().onboardRefreshUrl
        }?e=${user?.email}`,
        return_url: this.secretService.getStripeCreds().onboardReturnUrl,
        type: 'account_onboarding',
        collect: 'eventually_due',
      });

      return {
        message: 'Account onboarding Link!',
        data: { alreadyInitiated: false, ...accountLink },
      };
    } catch (error) {
      // console.log(error);
      throw error as Error;
    }
  }

  async refreshOnboardingLink(
    userOnboardingRefreshUrlDto: UserOnboardingRefreshUrlDto,
  ) {
    const { email } = userOnboardingRefreshUrlDto;

    const user = await this.prismaService.user.findFirst({
      where: {
        email: email,
        deletedAt: null,
      },
      include: {
        userStripeConnectAccount: true,
      },
    });
    throwBadRequestErrorCheck(!user, 'No user found!');

    throwBadRequestErrorCheck(
      !user?.userStripeConnectAccount?.stripeAccountId,
      'User onboarding is not initiated yet! Please use onboard url to initiate onboarding.',
    );

    const accountLink = await this.stripe.accountLinks.create({
      account: user?.userStripeConnectAccount?.stripeAccountId,
      refresh_url: `${
        this.secretService.getStripeCreds().onboardRefreshUrl
      }?e=${email ?? user?.email}`,
      return_url: this.secretService.getStripeCreds().onboardReturnUrl,
      type: 'account_onboarding',
      collect: 'eventually_due',
    });

    return {
      message: 'Account onboarding Link!',
      data: accountLink,
    };
  }

  async userStripeExpressDashboardLink(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        userStripeConnectAccount: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'No user found!');

    try {
      const link = await this.stripe.accounts.createLoginLink(
        user?.userStripeConnectAccount?.stripeAccountId,
      );
      return {
        message: 'Stripe login link!',
        data: link,
      };
    } catch (e) {
      console.log(e);
      return {
        statusCode: e.statusCode,
        message: e.message,
      };
    }
  }
}
