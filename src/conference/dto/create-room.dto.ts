import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { HmsRoomTypeEnum } from 'src/utils/enums';

export class CreateRoomDto {
  @ApiProperty({ required: true })
  @IsString()
  appointmentOpk: string;

  @ApiProperty({ required: true, enum: HmsRoomTypeEnum })
  @IsEnum(HmsRoomTypeEnum)
  roomType: HmsRoomTypeEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  provider: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  owner: string;

  @ApiProperty({ example: new Date().toISOString() })
  @IsOptional()
  @IsDateString()
  createdAt: string;
}
