// TODO: CREATE_APPOINTMENT_PROPOSAL_DTO
// TODO: UPDATE_APPOINTMENT_PROPOSAL_DTO
// TODO: ACCEPT_APPOINTMENT_PROPOSAL_DTO
// TODO: CANCEL_APPOINTMENT_PROPOSAL_DTO

import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { AppointmentLengthTypeEnum } from '../helpers/appointment-enum';

export class CreateAppointmentProposalDto {
  @ApiProperty()
  @IsNotEmpty()
  providerServiceId: number;

  @ApiProperty()
  @IsNotEmpty()
  userId: number;

  @ApiProperty()
  @IsNotEmpty()
  providerId: number;

  // @ApiProperty()
  // @IsNotEmpty()
  // providerTimeZone: string;

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
  @IsDateString()
  recurringStartDate?: string;

  @ApiProperty()
  @IsOptional()
  recurringSelectedDay?: string[];

  @ApiProperty()
  @IsOptional()
  firstMessage?: string;

  @ApiProperty()
  @IsOptional()
  formattedMessage?: string;

  @ApiProperty()
  @IsOptional()
  isRecivedPhotos?: boolean;
}
