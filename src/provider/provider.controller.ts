import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { ProviderService } from './provider.service';

@ApiTags('Provider')
@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get('/details/:opk')
  async get(@Param('opk') opk: string) {
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid provider opk. Please, try again after sometime with valid provider opk.',
    );
    return this.providerService.getProviderDetails(opk);
  }
}
