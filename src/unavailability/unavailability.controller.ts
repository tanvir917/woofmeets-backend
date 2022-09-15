import { UnavailabilityDeletionService } from './unavailability-delete.service';
import { DeleteUnavailabilityDto } from './dto/delete-unavailability.dto';
import { UnavailabilityCreationService } from './unavailability-creation.service';
import { JwtAuthGuard } from './../auth/jwt-auth.guard';
import {
  CreateUnavailibityDto,
  BulkCreateUnavailabilityDto,
} from './dto/create-unavailability.dto';
import {
  Body,
  Controller,
  Delete,
  Post,
  Request,
  UseGuards,
  Version,
} from '@nestjs/common';

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
    type: BulkCreateUnavailabilityDto,
  })
  @Version('2')
  @Post()
  async createBulk(
    @Body() createUnavailability: BulkCreateUnavailabilityDto,
    @Request() req,
  ) {
    const userId = BigInt(req?.user?.id ?? -1);

    return this.unavailabilityService.createBulk(createUnavailability, userId);
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
