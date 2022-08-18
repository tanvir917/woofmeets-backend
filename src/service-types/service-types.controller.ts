import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from 'src/transform.interceptor';
import { ServiceTypesService } from './service-types.service';

@ApiTags('Service Types')
@UseInterceptors(TransformInterceptor)
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  @Get()
  findAll() {
    return this.serviceTypesService.findAll();
  }
}
