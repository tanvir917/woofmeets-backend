import { PartialType } from '@nestjs/swagger';
import { CreateBasicInfoDto } from './create-user-basic-info.dto';

export class UpdateBasicInfoDto extends PartialType(CreateBasicInfoDto) {}
