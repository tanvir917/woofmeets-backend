import { ApiProperty } from '@nestjs/swagger';

export class CreateCouponUsersDto {
  @ApiProperty({ isArray: true, items: { type: 'number' } })
  userList: number[];

  @ApiProperty()
  maxUse: number;
}
