import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { HmsRoomTypeEnum } from 'src/utils/enums';

export class JoinRoomDto {
  @ApiProperty()
  appointmentOpk: string;

  @ApiProperty({ required: true, enum: HmsRoomTypeEnum })
  @IsEnum(HmsRoomTypeEnum)
  roomType: HmsRoomTypeEnum;
}

export class LeaveRoomDto {
  @ApiProperty()
  appointmentOpk: string;

  @ApiProperty({ required: true, enum: HmsRoomTypeEnum })
  @IsEnum(HmsRoomTypeEnum)
  roomType: HmsRoomTypeEnum;
}

export class FindRoomDto {
  @ApiProperty({
    required: false,
    description:
      'Use last value from the response or keep it empty for first page.',
  })
  start: string;

  @ApiProperty({
    required: false,
    example: 20,
    description: 'Limit can not be less than 10 and greater than 100.',
  })
  limit: number;

  @ApiProperty({ required: false, enum: ['true', 'false'] })
  enabled: string;
}
