import { PartialType } from '@nestjs/swagger';
import { CreateProviderDetailsDto } from './create-provider-details.dto';

export class UpdateProviderDetailsDto extends PartialType(
  CreateProviderDetailsDto,
) {}
