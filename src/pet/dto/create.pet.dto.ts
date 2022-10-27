import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  EnergyLevelTypeEnum,
  FriendlyTypeEnum,
  GenderTypeEnum,
  PetTypeEnum,
} from 'src/utils/enums';
import { ToBoolean } from 'src/utils/tools/boolean.transform';

export class CreatePetDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  @IsOptional()
  profile_image?: any;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(PetTypeEnum)
  type: PetTypeEnum;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  weight: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  ageYear: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  ageMonth: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dob?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(GenderTypeEnum)
  gender: GenderTypeEnum;

  @ApiProperty()
  @IsNotEmpty()
  breeds: any;

  @ApiProperty({ required: false })
  @IsOptional()
  @ToBoolean()
  microchipped?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @ToBoolean()
  spayedOrNeutered?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  houseTrained?: FriendlyTypeEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  houseTrainedAdditionalDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  childFriendly?: FriendlyTypeEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  childFrinedlyAdditionalDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  dogFriendly?: FriendlyTypeEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  dogFrinedlyAdditionalDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  catFriendly?: FriendlyTypeEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  catFrinedlyAdditionalDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  energyLevel?: EnergyLevelTypeEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  feedingSchedule?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  feedingScheduleDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pottyBreakSchedule?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pottyBreakScheduleDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  canLeftAlone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  canLeftAloneDetails?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pillMedication?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  topicalMedication?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  injectionMedication: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sitterInstructions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vetInfo?: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  @IsOptional()
  gallery?: any[];
}
