import { ApiProperty } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ required: true, description: 'Coupon code. Must be unique.' })
  code: string;

  @ApiProperty({
    required: false,
    description: 'Amount of discount. Is must if percentage is not given.',
  })
  amount: number;

  @ApiProperty({
    required: false,
    description: 'Percentage of discount. Is must if amount is not given',
  })
  percentage: number;

  @ApiProperty({
    required: false,
    description: 'Minimum amount spent to avail the coupon.',
  })
  minSpent: number;

  @ApiProperty({
    required: false,
    description: 'Maximum discount amount redeemable per single use.',
  })
  maxCapPerUse: number;

  @ApiProperty({
    required: false,
    description:
      'Maximum number of times the coupon can be used by a single user.',
  })
  maxLimitPerUser: number;

  @ApiProperty({ required: false, description: 'Coupon expiry date.' })
  expiresAt: Date;

  @ApiProperty({
    required: true,
    description:
      'Decides if the coupon is for public use or for selected user.',
  })
  isPublic: boolean;
}
