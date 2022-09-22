import { PartialType } from '@nestjs/swagger';
import { CreateCheckrDto } from './create-checkr.dto';

export class UpdateCheckrDto extends PartialType(CreateCheckrDto) {}
