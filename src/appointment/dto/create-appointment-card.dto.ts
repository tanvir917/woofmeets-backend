import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentCardDto {
  @ApiProperty()
  @IsNotEmpty()
  appointmentId: number;

  @ApiProperty()
  @IsOptional()
  appointmentDateId?: number;

  @ApiProperty()
  @IsOptional()
  images?: any;

  @ApiProperty()
  @IsOptional()
  petsData?: any;

  @ApiProperty()
  @IsOptional()
  @IsString()
  medication?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  totalWalkTime?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  distance?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  distanceUnit?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  generateTime?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  submitTime?: string;
}
