import { Injectable } from '@nestjs/common';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponUsersDto } from './dto/create-coupon-users.dto';

@Injectable()
export class CouponUsersService {
  constructor(private prismaService: PrismaService) {}

  async addCouponUser(
    userId: bigint,
    couponId: bigint,
    createCouponUsersDto: CreateCouponUsersDto,
  ) {
    const { userList, maxUse } = createCouponUsersDto;

    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    const coupon = await this.prismaService.coupons.findFirst({
      where: {
        id: couponId,
        deletedAt: null,
        expiresAt: { gte: new Date() },
      },
    });

    throwBadRequestErrorCheck(!coupon, 'Coupon not found!');

    throwBadRequestErrorCheck(
      coupon.createdBy != user?.id,
      'Unauthorized! Not your coupon.',
    );

    const createManyData = userList.map((item) => {
      return {
        userId: BigInt(item),
        couponId: couponId,
        maxUse,
      };
    });

    const createdCoupons = await this.prismaService.couponUsers.createMany({
      data: createManyData,
    });

    return {
      message: 'User added to coupon successfully!',
      couponUsers: createdCoupons,
    };
  }
}
