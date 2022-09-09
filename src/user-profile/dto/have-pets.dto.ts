import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { HavePetsTypeEnum } from 'src/utils/enums';

export class CheckHavePetDTo {
  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(HavePetsTypeEnum)
  havePets: HavePetsTypeEnum;
}
