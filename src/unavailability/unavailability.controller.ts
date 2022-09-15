import { UnavailabilityDeletionService } from './unavailability-delete.service';
import { DeleteUnavailabilityDto } from './dto/delete-unavailability.dto';
import { UnavailabilityCreationService } from './unavailability-creation.service';
import { JwtAuthGuard } from './../auth/jwt-auth.guard';
import { CreateUnavailibityDto } from './dto/create-unavailability.dto';
import {
  Body,
  Controller,
  Delete,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UnavailabilityService } from './unavailability.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Unavailability')
@Controller('unavailability')
export class UnavailabilityController {
  constructor(
    private readonly unavailabilityService: UnavailabilityCreationService,
    private readonly unavailabilityDeletionService: UnavailabilityDeletionService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: CreateUnavailibityDto,
  })
  @Post()
  async create(
    @Body() createUnavailability: CreateUnavailibityDto,
    @Request() req,
  ) {
    const userId = BigInt(req?.user?.id ?? -1);
    return this.unavailabilityService.createSingle(
      createUnavailability,
      userId,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: DeleteUnavailabilityDto,
  })
  @Delete()
  async delete(
    @Body() deleteUnavailabilities: DeleteUnavailabilityDto,
    @Request() req,
  ) {
    const userId = BigInt(req?.user?.id ?? -1);
    return this.unavailabilityDeletionService.delete(
      deleteUnavailabilities,
      userId,
    );
  }
}
