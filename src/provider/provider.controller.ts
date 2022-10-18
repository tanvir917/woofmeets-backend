import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailabilityGetServcie } from 'src/availability/services/availability.get.service';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { ProviderCreationDto } from './dto/creation.dto';
import { GetAvailableCalenderDto } from './dto/get.available.dto';
import { RecommendedProviderDto } from './dto/recommended.dto';
import { SearchProviderDto } from './dto/search.provider.dto';
import { ProviderCreationService } from './provider-creation.service';
import { ProviderListService } from './provider-list.service';
import { ProviderRecommendedService } from './provider-recommended.service';
import { ProviderService } from './provider.service';

@ApiTags('Provider')
@Controller('provider')
export class ProviderController {
  constructor(
    private readonly providerService: ProviderService,
    private readonly jwtService: JwtService,
    private readonly availableGetService: AvailabilityGetServcie,
    private readonly providerCreationService: ProviderCreationService,
    private readonly providerListService: ProviderListService,
    private readonly recommendedService: ProviderRecommendedService,
  ) {}

  @ApiOperation({
    summary: 'Get all provider for search api.',
  })
  @Get()
  async getProvidersList(@Query() query: SearchProviderDto) {
    return this.providerListService.search(query);
  }

  @ApiOperation({
    summary: 'Get all information of provider for landing page.',
  })
  @Get('/:opk/details')
  async get(@Param('opk') opk: string, @Request() req: any) {
    let viewer: any;
    if (
      req?.cookies &&
      'token' in req?.cookies &&
      req?.cookies?.token?.length > 0
    ) {
      viewer = this.jwtService.decode(req?.cookies?.token);
    }

    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid provider opk. Please, try again after sometime with valid provider opk.',
    );
    return this.providerService.getProviderDetails(viewer?.opk ?? '', opk);
  }

  @ApiOperation({
    summary: 'Get provider calender for specific service.',
  })
  @Get('/:opk/calender/:serviceId')
  async getAvailability(
    @Param('opk') opk: string,
    @Param('serviceId') serviceId: number,
    @Query() query: GetAvailableCalenderDto,
  ) {
    return this.availableGetService.getAvailability(
      opk,
      BigInt(serviceId),
      query,
    );
  }

  @ApiOperation({
    summary: 'Get recommended providers. Queries are optional.',
  })
  @Get('/recommended')
  async recommendedProvider(@Query() query: RecommendedProviderDto) {
    return this.recommendedService.recommended(query);
  }

  @Post('complete-onboarding-progress')
  async completeUserOnboarding(@Body() body: ProviderCreationDto) {
    return this.providerCreationService.seed(body);
  }
}
