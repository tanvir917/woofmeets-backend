import { Injectable } from '@nestjs/common';
import { CouponUsers } from '@prisma/client';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: bigint, createCouponDto: CreateCouponDto) {
    const {
      code,
      amount,
      expiresAt,
      maxCapPerUse,
      maxLimitPerUser,
      minSpent,
      percentage,
      isPublic,
    } = createCouponDto;

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    throwBadRequestErrorCheck(!user, 'User not found');

    const coupon = await this.prismaService.coupons.findFirst({
      where: { code: code, deletedAt: null, expiresAt: { gte: new Date() } },
    });

    throwBadRequestErrorCheck(!!coupon, 'Coupon already exists');

    const createdCoupon = await this.prismaService.coupons.create({
      data: {
        code,
        amount,
        maxCapPerUse,
        maxLimitPerUser,
        minSpent,
        percentage,
        isPublic,
        createdBy: user?.id,
        expiresAt,
      },
    });

    throwBadRequestErrorCheck(!createdCoupon, 'Coupon could not be created');

    return {
      message: 'Coupon created successfully.',
      coupon: createdCoupon,
    };
  }

  async findAllCouponAdmin(userId: bigint) {
    const admin = await this.prismaService.admin.findFirst({
      where: { userId: userId, deletedAt: null },
    });
    throwBadRequestErrorCheck(
      !admin,
      'Unauthorized! You dont have the permission to view this.',
    );

    const coupons = await this.prismaService.coupons.findMany({
      where: { deletedAt: null, expiresAt: { gte: new Date() } },
    });

    throwBadRequestErrorCheck(!coupons, 'Coupons not found');

    return { message: 'Coupons fetched successfully.', coupons: coupons };
  }

  async findAllUsersCoupon(userId: bigint) {
    const coupons = await this.prismaService.coupons.findMany({
      where: {
        deletedAt: null,
        expiresAt: { gte: new Date() },
        createdBy: userId,
      },
    });

    throwBadRequestErrorCheck(!coupons, 'Coupons not found');

    return { message: 'Coupons fetched successfully.', coupons: coupons };
  }

  async findOne(code: string) {
    const coupon = await this.prismaService.coupons.findFirst({
      where: { code: code, deletedAt: null, expiresAt: { gte: new Date() } },
      select: {
        id: true,
        code: true,
        amount: true,
        percentage: true,
        minSpent: true,
        maxCapPerUse: true,
        isPublic: true,
      },
    });

    throwBadRequestErrorCheck(!coupon, 'Coupon not found');

    return { message: 'Coupon fetched successfully.', coupon: coupon };
  }

  async update(
    userId: bigint,
    couponId: bigint,
    updateCouponDto: UpdateCouponDto,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    throwBadRequestErrorCheck(!user, 'User not found');

    const coupon = await this.prismaService.coupons.findFirst({
      where: { id: couponId, deletedAt: null, expiresAt: { gte: new Date() } },
    });

    throwBadRequestErrorCheck(!coupon, 'Coupon not found');

    throwBadRequestErrorCheck(
      coupon?.createdBy != user?.id,
      'Unauthorized! You can not update this coupon',
    );

    const updatedCoupon = await this.prismaService.coupons.update({
      where: { id: coupon.id },
      data: {
        ...updateCouponDto,
      },
    });

    throwBadRequestErrorCheck(!updatedCoupon, 'Coupon could not be updated');

    return {
      message: 'Coupon updated successfully.',
      coupon: updatedCoupon,
    };
  }

  async remove(userId: bigint, couponId: bigint) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    throwBadRequestErrorCheck(!user, 'User not found');

    const coupon = await this.prismaService.coupons.findFirst({
      where: { id: couponId, deletedAt: null, expiresAt: { gte: new Date() } },
    });

    throwBadRequestErrorCheck(!coupon, 'Coupon not found');

    throwBadRequestErrorCheck(
      coupon?.createdBy != user?.id,
      'Unauthorized! Can not delete this coupon',
    );

    const deletedCoupon = await this.prismaService.coupons.update({
      where: { id: coupon?.id },
      data: {
        deletedAt: new Date(),
        meta: Object({
          deletedBy: user?.id,
        }),
      },
    });

    throwBadRequestErrorCheck(!deletedCoupon, 'Coupon could not be deleted');

    return {
      message: 'Coupon deleted successfully.',
      coupon: deletedCoupon,
    };
  }

  /**
   * Below service calculate and return the discount amount for the coupon and keep a track in couponTrack table
   * TODO: Appointment prices are not yet implemented. So, for now, we are leaving this service as incomplete.
   */
  async addCouponToAppointment(
    userId: bigint,
    couponId: bigint,
    appointmentId: bigint,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    const coupon = await this.prismaService.coupons.findFirst({
      where: { id: couponId, deletedAt: null, expiresAt: { gte: new Date() } },
    });
    throwBadRequestErrorCheck(!coupon, 'Coupon not found');

    let couponUser: CouponUsers;

    if (!coupon.isPublic) {
      couponUser = await this.prismaService.couponUsers.findFirst({
        where: { couponId: couponId, userId: user?.id, deletedAt: null },
      });

      throwBadRequestErrorCheck(
        !couponUser || couponUser?.count >= coupon?.maxLimitPerUser,
        'Unauthorized! You can not use this coupon',
      );
    }

    const appointment = await this.prismaService.appointment.findFirst({
      where: { id: appointmentId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!appointment, 'Appointment not found');
  }
}
