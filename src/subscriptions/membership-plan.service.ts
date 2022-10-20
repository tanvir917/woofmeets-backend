import { Injectable } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import Stripe from 'stripe';
import { AdminPanelService } from '../admin-panel/admin-panel.service';
import { CommonService } from '../common/common.service';
import {
  throwBadRequestErrorCheck,
  throwUnauthorizedErrorCheck,
} from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan-dto';

@Injectable()
export class MembershipPlanService {
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

  async createMembershipPlan(
    userId: bigint,
    createMembershipPlanDto: CreateMembershipPlanDto,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    const { name, displayName, details, features } = createMembershipPlanDto;
    let slug = this.commonService.getSlug(name);
    let slugExists = true;

    while (slugExists) {
      const plan = await this.prismaService.membershipPlan.findFirst({
        where: {
          slug,
        },
      });

      if (!plan) {
        slugExists = false;
      } else {
        const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 6);
        slug = this.commonService.getSlug(name + ' ' + nanoid(6));
      }
    }

    const product = await this.stripe.products.create({
      name: displayName,
      description: details,
    });

    const membershipPlan = await this.prismaService.membershipPlan.create({
      data: {
        name,
        stripeProductId: product?.id,
        slug,
        displayName,
        details,
        active: true,
        features,
      },
    });

    throwBadRequestErrorCheck(
      !membershipPlan,
      'Membership plan not created. Please try again.',
    );

    return {
      message: 'Membership plan created successfully',
      data: membershipPlan,
    };
  }

  async getMembershipPlans() {
    const membershipPlan = await this.prismaService.membershipPlan.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        displayName: true,
        details: true,
        features: true,
        MembershipPlanPrices: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            rate: true,
            cropRate: true,
            validity: true,
            meta: true,
          },
        },
      },
      orderBy: { sequence: 'asc' },
    });

    throwBadRequestErrorCheck(
      !membershipPlan.length,
      'No Membership plans found',
    );

    return {
      message: 'Membership plans fetched successfully',
      data: membershipPlan,
    };
  }

  async updateMembershipPlan(
    userId: bigint,
    planId: bigint,
    updateMembershipPlanDto: UpdateMembershipPlanDto,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );
    const { name, displayName, details, features } = updateMembershipPlanDto;

    const membershipPlan = await this.prismaService.membershipPlan.findFirst({
      where: {
        id: planId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!membershipPlan, 'Membership plan not found');

    await this.stripe.products.update(membershipPlan.stripeProductId, {
      name: displayName,
      description: details,
    });

    const updatedMembershipPlan =
      await this.prismaService.membershipPlan.update({
        where: {
          id: planId,
        },
        data: {
          name,
          displayName,
          details,
          features,
        },
      });

    throwBadRequestErrorCheck(
      !updatedMembershipPlan,
      'Membership plan not updated. Please try again.',
    );

    return {
      message: 'Membership plan updated successfully',
      data: updatedMembershipPlan,
    };
  }

  async deleteMembershipPlan(userId: bigint, planId: bigint) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );
    const membershipPlan = await this.prismaService.membershipPlan.findFirst({
      where: {
        id: planId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!membershipPlan, 'Membership plan not found');

    const deletedMembershipPlan =
      await this.prismaService.membershipPlan.update({
        where: {
          id: planId,
        },
        data: {
          deletedAt: new Date(),
        },
      });

    throwBadRequestErrorCheck(
      !deletedMembershipPlan,
      'Membership plan not deleted. Please try again.',
    );

    return {
      message: 'Membership plan deleted successfully',
      data: deletedMembershipPlan,
    };
  }
}
