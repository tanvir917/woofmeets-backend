import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SubscriptionPackageTypeEnum } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({ type: 'enum', enum: SubscriptionPackageTypeEnum })
  @IsEnum(SubscriptionPackageTypeEnum)
  packageType: SubscriptionPackageTypeEnum;
}

export class CreateSubscriptionQueryDto {
  @ApiProperty()
  priceId: number;

  @ApiProperty({ required: false })
  cardId: number;
}
