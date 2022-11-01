import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
}
