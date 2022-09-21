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
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  Version,
} from '@nestjs/common';

import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetUnavailabilityDto } from './dto/get-unavailability.dto';
import { UnavailabilityService } from './unavailability.service';

@ApiTags('Unavailability')
@Controller('unavailability')
export class UnavailabilityController {
  constructor(
    private readonly unavailabilityCreateService: UnavailabilityCreationService,
    private readonly unavailabilityDeletionService: UnavailabilityDeletionService,
    private readonly unavailabilityService: UnavailabilityService,
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
    return this.unavailabilityCreateService.createSingle(
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

    return this.unavailabilityCreateService.createBulk(
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

  @Get()
  async get(@Query() getUnavailability: GetUnavailabilityDto) {
    return this.unavailabilityService.get(getUnavailability);
  }
}
