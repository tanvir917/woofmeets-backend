import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ProviderServiceToggleDto {
  @ApiProperty()
  @IsNotEmpty()
  providerServiceId: any;
}
