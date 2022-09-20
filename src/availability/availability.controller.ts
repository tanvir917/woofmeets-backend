import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AvailabilityService } from './services/availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AvailableDateService } from './services/available.date.service';
import { CreateAvailableDateDto } from './dto/create-date.dto';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly availableDateService: AvailableDateService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary: 'Create available day for a specific provider service.',
  })
  create(
    @Request() req: any,
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.availabilityService.create(userId, createAvailabilityDto);
  }

  @ApiOperation({
    summary:
      'Get available day for a specific provider service. Pass provider service id as serviceId.',
  })
  @Get('/service/:serviceId')
  findOne(@Param('serviceId') id: string) {
    const serviceId = BigInt(id) ?? BigInt(-1);
    return this.availabilityService.findOne(serviceId);
  }

  @ApiOperation({
    summary: 'Update available day for a specific provider service.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    const serviceId = BigInt(id) ?? BigInt(-1);

    return this.availabilityService.update(
      serviceId,
      userId,
      updateAvailabilityDto,
    );
  }

  @ApiOperation({
    summary: 'Add available date for a specific provider service.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/add-dates')
  addAvailableDate(@Request() req: any, @Body() body: CreateAvailableDateDto) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.availableDateService.addAvailableDate(userId, body);
  }
}
