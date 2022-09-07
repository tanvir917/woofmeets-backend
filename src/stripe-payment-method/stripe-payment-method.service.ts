import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { AddCardDto, CreateTokenDto } from './dto/add-card.dto';
import { CreateStripePaymentMethodDto } from './dto/create-stripe-payment-method.dto';
import { UpdateStripePaymentMethodDto } from './dto/update-stripe-payment-method.dto';

@Injectable()
export class StripePaymentMethodService {
  stripe: Stripe;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });
  }
  async getOrCreateCustomer(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        userStripeCustomerAccount: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    if (!!user?.userStripeCustomerAccount) {
      return {
        message: 'Client found!',
        data: user?.userStripeCustomerAccount,
      };
    }

    const params: Stripe.CustomerCreateParams = {
      email: user?.email,
      name: `${user?.firstName} ${user?.lastName}`,
    };

    const customer: Stripe.Customer = await this.stripe.customers.create(
      params,
    );

    throwBadRequestErrorCheck(!customer, 'Customer can not be created.');

    const createdCustomer =
      await this.prismaService.userStripeCustomerAccount.create({
        data: {
          userId: user?.id,
          stripeCustomerId: customer?.id,
          email: user?.email,
        },
      });
    throwBadRequestErrorCheck(!createdCustomer, 'Customer can not be created.');

    return {
      message: 'Customer created Successfully!',
      data: createdCustomer,
    };
  }

  async createCardToken(createTokenDto: CreateTokenDto) {
    try {
      const {
        number,
        exp_month,
        exp_year,
        cvc,
        address_city,
        address_country,
        address_line1,
        address_state,
        address_zip,
      } = createTokenDto;
      const cardInfo: Stripe.TokenCreateParams.Card = {
        number: number,
        exp_month: exp_month,
        exp_year: exp_year,
        cvc: cvc,
        address_city,
        address_country,
        address_line1,
        address_state,
        address_zip,
      };

      const token: Stripe.Token = await this.stripe.tokens.create({
        card: cardInfo,
      });
      return { data: token };
    } catch (error) {
      throw error as Error;
    }
  }

  async addCard(userId: bigint, addCardDto: AddCardDto) {
    const { customerId, countryId, token } = addCardDto;

    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        userStripeCustomerAccount: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    throwBadRequestErrorCheck(
      !user.userStripeCustomerAccount,
      'Customer not found.',
    );

    throwBadRequestErrorCheck(
      user?.userStripeCustomerAccount?.stripeCustomerId !== customerId,
      'Customer does not match!',
    );

    const userCard = await this.prismaService.userStripeCard.findMany({
      where: {
        userId: user?.id,
        deletedAt: null,
      },
    });

    let defaultcard = false;

    if (!userCard || !userCard.length) {
      defaultcard = true;
    }

    const source: Stripe.CustomerSourceCreateParams = {
      source: token,
    };

    const card: Stripe.CustomerSource =
      await this.stripe.customers.createSource(
        user?.userStripeCustomerAccount?.stripeCustomerId,
        source,
      );

    throwBadRequestErrorCheck(
      !card,
      'Can not add card! Please try again later!',
    );

    const tempCard = Object(card);

    const createdCard = await this.prismaService.userStripeCard.create({
      data: {
        userId: user?.id,
        stripeCardId: tempCard?.id,
        brand: tempCard?.brand,
        customerCountry: tempCard?.country,
        stripeCustomerId: tempCard?.customer,
        expMonth: tempCard?.exp_month,
        expYear: tempCard.exp_year,
        last4: tempCard?.last4,
        funding: tempCard.funding,
        isDefault: defaultcard,
        name: tempCard?.name,
        city: tempCard?.address_city,
        countryId: countryId,
        addressLine1: tempCard?.address_line1,
        addressLine2: tempCard?.address_line2,
        state: tempCard?.address_state,
        zipCode: tempCard?.address_zip,
        meta: tempCard,
      },
      select: {
        id: true,
        userId: true,
        brand: true,
        country: true,
        expMonth: true,
        expYear: true,
        last4: true,
        funding: true,
        isDefault: true,
        name: true,
        city: true,
        state: true,
        customerCountry: true,
        addressLine1: true,
        addressLine2: true,
        zipCode: true,
      },
    });
    return {
      message: 'Card added Successfully!',
      data: createdCard,
    };
  }

  async getAllCards(userId: bigint) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
        include: {
          userStripeCustomerAccount: true,
        },
      });

      throwBadRequestErrorCheck(!user, 'User not found.');

      throwBadRequestErrorCheck(
        !user?.userStripeCustomerAccount,
        'User is not a stripe customer.',
      );

      const allCards = await this.prismaService.userStripeCard.findMany({
        where: { userId: user?.id, deletedAt: null },
        select: {
          id: true,
          userId: true,
          brand: true,
          country: true,
          expMonth: true,
          expYear: true,
          last4: true,
          funding: true,
          isDefault: true,
          name: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          customerCountry: true,
          state: true,
          zipCode: true,
        },
      });

      throwBadRequestErrorCheck(!allCards.length, 'No card found.');

      return {
        message: 'Cards found Successfully!',
        data: allCards,
      };
    } catch (error) {
      throw error as Error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} stripePaymentMethod`;
  }
}
