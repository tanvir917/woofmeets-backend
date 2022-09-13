import { Controller, Get, Param, Request } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { ProviderService } from './provider.service';

@ApiTags('Provider')
@Controller('provider')
export class ProviderController {
  constructor(
    private readonly providerService: ProviderService,
    private readonly jwtService: JwtService,
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
}
