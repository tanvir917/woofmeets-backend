import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import {
  AppointmentLengthTypeEnum,
  AppointmentProposalEnum,
} from '../helpers/appointment-enum';

export class UpdateAppointmentProposalDto {
  @ApiProperty()
  @IsEnum(AppointmentProposalEnum)
  proposedBy: AppointmentProposalEnum;

  @ApiProperty()
  @IsEnum(AppointmentLengthTypeEnum)
  appointmentserviceType: AppointmentLengthTypeEnum;

  @ApiProperty()
  @IsNotEmpty()
  petsId: any;

  @ApiProperty()
  @IsOptional()
  length?: number;

  @ApiProperty()
  @IsOptional()
  additionalLengthPrice?: number;

  @ApiProperty()
  @IsOptional()
  regularPrice?: number;

  @ApiProperty()
  @IsOptional()
  additionalCharge?: object;

  @ApiProperty()
  @IsOptional()
  providerExtraFee?: number;

  @ApiProperty()
  @IsOptional()
  totalPrice?: number;

  @ApiProperty()
  @IsOptional()
  dropOffStartTime?: string;

  @ApiProperty()
  @IsOptional()
  dropOffEndTime?: string;

  @ApiProperty()
  @IsOptional()
  pickUpStartTime?: string;

  @ApiProperty()
  @IsOptional()
  pickUpEndTime?: string;

  @ApiProperty()
  @IsOptional()
  proposalStartDate?: string;

  @ApiProperty()
  @IsOptional()
  proposalEndDate?: string;

  @ApiProperty()
  @IsOptional()
  @IsDateString({}, { each: true })
  proposalOtherDate: string[];

  @ApiProperty()
  @IsOptional()
  proposalVisits?: any;

  @ApiProperty()
  @IsOptional()
  isRecurring?: boolean;

  @ApiProperty()
  @IsOptional()
  recurringStartDate?: string;

  @ApiProperty()
  @IsOptional()
  recurringSelectedDay?: any;

  @ApiProperty()
  @IsOptional()
  formattedMessage?: string;
}
