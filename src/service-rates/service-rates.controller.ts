import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransformInterceptor } from 'src/transform.interceptor';
import { CreateMultipleServiceRateDto } from './dto/create-multiple-service-rate.dto';
import { CreateServiceRateDto } from './dto/create-service-rate.dto';
import { CreateServiceTypeRateDto } from './dto/create-type-rate.dto';
import { UpdateServiceRateDto } from './dto/update-service-rate.dto';
import { ServiceRatesService } from './service-rates.service';
import { ServiceTypeHasRatesService } from './service-type-has-rate.service';

@ApiTags('Service Rates')
@UseInterceptors(TransformInterceptor)
@Controller('service-rates')
export class ServiceRatesController {
  constructor(
    private readonly serviceRatesService: ServiceRatesService,
    private readonly serviceTypeRatesService: ServiceTypeHasRatesService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/type-has-rate')
  @ApiOperation({
    summary:
      'Create rate for service type. A service type can have multiple rates.',
  })
  createServiceTypeRate(@Body() body: CreateServiceTypeRateDto) {
    return this.serviceTypeRatesService.create(body);
  }

  @Get('/type-has-rate/:serviceTypeId')
  @ApiOperation({
    summary:
      'Get all rate for specific service type. Pass service type id as param.',
  })
  getServiceTypeRate(@Param('serviceTypeId') id: string) {
    return this.serviceTypeRatesService.findOne(+id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('/type-has-rate/:id')
  @ApiOperation({
    summary:
      'To delete a specific rate from service type. Pass service-type-rate id as param.',
  })
  deleteServiceTypeRate(@Param('id') id: string) {
    return this.serviceTypeRatesService.remove(+id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({
    summary:
      'Create rate for provider service. A service type can have multiple rates.',
  })
  create(@Body() createServiceRateDto: CreateServiceRateDto) {
    return this.serviceRatesService.create(createServiceRateDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/multiple/create')
  @ApiOperation({
    summary:
      'Create multiple rate at a time for provider service. Pass an array of object of service rates like create method in body',
  })
  async multipleCreate(
    @Body() createMultipleServiceRateDto: CreateMultipleServiceRateDto,
  ) {
    return this.serviceRatesService.multipleCreate(
      createMultipleServiceRateDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/:servicesRateId')
  @ApiOperation({
    summary: 'Update rate for provider service. Pass service rate id as param.',
  })
  update(
    @Param('servicesRateId') id: string,
    @Body() updateServiceRateDto: UpdateServiceRateDto,
  ) {
    const servicesRateId = BigInt(id) ?? BigInt(-1);
    return this.serviceRatesService.update(
      servicesRateId,
      updateServiceRateDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/muptiple/update')
  @ApiOperation({
    summary:
      'Update multiple rate at a time for provider service. Pass an array of object of service rates like create method in body.',
  })
  async multipleUpdate(
    @Body() createMultipleServiceRateDto: CreateMultipleServiceRateDto,
  ) {
    return this.serviceRatesService.multipleUpdate(
      createMultipleServiceRateDto,
    );
  }

  @Get(':providerServicesId')
  @ApiOperation({
    summary:
      'Get all rates for provider serivce. Pass provider service id as param.',
  })
  findOne(@Param('providerServicesId') id: string) {
    const providerServicesId = BigInt(id) ?? BigInt(-1);
    return this.serviceRatesService.findOne(providerServicesId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a particular provider service rate.',
  })
  remove(@Param('id') id: string) {
    return this.serviceRatesService.remove(+id);
  }
}
