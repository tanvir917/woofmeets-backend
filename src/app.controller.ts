import { Controller, Get, Param, Query, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetLocationDto } from './app.dto';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/location/:address')
  async getLocation(@Param() data: GetLocationDto) {
    const { address } = data;
    return this.appService.getAddress(address);
  }

  @ApiOperation({
    summary: 'To get predicted location of a certain place.',
  })
  @Get('predicted-locations')
  async getPredictedLocations(@Query('inputPlace') inputPlace: string) {
    return this.appService.getPredictedLocations(inputPlace);
  }

  @ApiOperation({
    summary: 'To get latitude and longitude from a particular place id.',
  })
  @Get('latlong')
  async getPlaceIdToLatLong(@Query('placeId') placeId: string) {
    return this.appService.getPlaceIdToLatLong(placeId);
  }

  @Version('2')
  @Get('/location')
  async getLocationV2(@Query('address') address: string) {
    return this.appService.getAddress(address);
  }
}
