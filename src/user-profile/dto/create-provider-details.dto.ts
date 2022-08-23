import { ApiProperty } from '@nestjs/swagger';

export class CreateProviderDetailsDto {
  @ApiProperty()
  headline: string;

  @ApiProperty()
  yearsOfExperience: number;

  @ApiProperty({ required: false })
  dogsExperience: string;

  @ApiProperty({ required: false })
  walkingExperience: string;

  @ApiProperty({ required: false })
  requestedDogInfo: string;

  @ApiProperty()
  experienceDescription: string;

  @ApiProperty()
  environmentDescription: string;

  @ApiProperty()
  scheduleDescription: string;
}
