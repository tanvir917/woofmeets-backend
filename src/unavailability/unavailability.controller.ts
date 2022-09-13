import { JwtAuthGuard } from './../auth/jwt-auth.guard';
import { CreateUnavailibityDto } from './dto/create-unavailability.dto';
import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { UnavailabilityService } from './unavailability.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('Unavailability')
@Controller('unavailability')
export class UnavailabilityController {
  constructor(private readonly unavailabilityService: UnavailabilityService) {}

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
    return this.unavailabilityService.create(createUnavailability, userId);
  }
}
