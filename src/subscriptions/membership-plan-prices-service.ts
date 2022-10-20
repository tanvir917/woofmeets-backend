import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { AdminPanelService } from '../admin-panel/admin-panel.service';
import { CommonService } from '../common/common.service';
import {
  throwBadRequestErrorCheck,
  throwUnauthorizedErrorCheck,
} from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { CreateMembershipPlanPricesDto } from './dto/create-membership-plan-prices.dto';

@Injectable()
export class MembershipPlanPricesService {
  stripe: Stripe;
  constructor(
    private prismaService: PrismaService,
    private commonService: CommonService,
    private secretService: SecretService,
    private adminPanelService: AdminPanelService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });
  }

  async createMembershipPlanPrice(
    userId: bigint,
    planId: bigint,
    createMembershipPlanPricesDto: CreateMembershipPlanPricesDto,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    const { rate, cropRate, validity, meta } = createMembershipPlanPricesDto;

    const membershipPlan = await this.prismaService.membershipPlan.findFirst({
      where: {
        id: planId,
      },
    });

    throwBadRequestErrorCheck(
      !membershipPlan,
      'Membership Plan does not exist',
    );

    const priceObject = await this.stripe.prices.create({
      product: membershipPlan.stripeProductId,
      unit_amount: (cropRate == 0 || cropRate == null ? rate : cropRate) * 100,
      currency: 'usd',
      recurring: {
        interval: 'month',
        interval_count: validity,
      },
    });

    const membershipPlanPrice =
      await this.prismaService.membershipPlanPrices.create({
        data: {
          membershipPlanId: planId,
          stripePriceId: priceObject?.id,
          rate,
          cropRate,
          validity,
          meta,
        },
      });

    return {
      message: 'Membership Plan Price created successfully',
      data: membershipPlanPrice,
    };
  }

  async deleteMembershipPlanPrice(userId: bigint, priceId: bigint) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );
    const membershipPlanPrice =
      await this.prismaService.membershipPlanPrices.findFirst({
        where: {
          id: priceId,
          deletedAt: null,
        },
      });

    throwBadRequestErrorCheck(
      !membershipPlanPrice,
      'Membership Plan Price does not exist',
    );

    await this.stripe.prices.update(membershipPlanPrice?.stripePriceId, {
      active: false,
    });

    const deletedMembershipPlanPrice =
      await this.prismaService.membershipPlanPrices.update({
        where: {
          id: priceId,
        },
        data: {
          deletedAt: new Date(),
        },
      });

    return {
      message: 'Membership Plan Price deleted successfully',
      data: deletedMembershipPlanPrice,
    };
  }
}
