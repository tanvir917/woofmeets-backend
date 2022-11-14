import {
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransformInterceptor } from 'src/transform.interceptor';
import { ProviderServicesService } from './provider-services.service';

@ApiTags('Provider Services')
@Controller('provider-services')
@UseInterceptors(TransformInterceptor)
export class ProviderServicesController {
  constructor(
    private readonly providerServicesService: ProviderServicesService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/:serviceTypeId')
  create(@Param('serviceTypeId') serviceTypeId: number, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.providerServicesService.create(userId, +serviceTypeId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.providerServicesService.findAll(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('change-status/:providerServiceId')
  changeStatus(
    @Param('providerServiceId') providerServiceId: number,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.providerServicesService.changeIsActiveStatus(
      userId,
      BigInt(providerServiceId),
    );
  }
}
