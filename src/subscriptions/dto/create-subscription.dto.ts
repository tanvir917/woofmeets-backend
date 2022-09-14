import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SubscriptionPackageTypeEnum } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @ApiProperty({ type: 'enum', enum: SubscriptionPackageTypeEnum })
  @IsEnum(SubscriptionPackageTypeEnum)
  packageType: SubscriptionPackageTypeEnum;
}
