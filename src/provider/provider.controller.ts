import { Controller, Get, Param, Request, Query } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvailabilityGetServcie } from 'src/availability/services/availability.get.service';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { GetAvailableCalenderDto } from './dto/get.available.dto';
import { ProviderService } from './provider.service';

@ApiTags('Provider')
@Controller('provider')
export class ProviderController {
  constructor(
    private readonly providerService: ProviderService,
    private readonly jwtService: JwtService,
    private readonly availableGetService: AvailabilityGetServcie,
  ) {}

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
    return this.availableGetService.getAvailability(opk, serviceId, query);
  }
}
