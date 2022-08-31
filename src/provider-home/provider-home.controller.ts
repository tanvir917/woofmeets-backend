import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProviderHomeService } from './provider-home.service';
import { CreateProviderHomeDto } from './dto/create-provider-home.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';

@ApiTags('Provider Home')
@Controller('provider-home')
@UseInterceptors(TransformInterceptor)
export class ProviderHomeController {
  constructor(private readonly providerHomeService: ProviderHomeService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post()
  createOrUpdate(
    @Body() createProviderHomeDto: CreateProviderHomeDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.providerHomeService.createOrUpdate(
      userId,
      createProviderHomeDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get()
  getProviderHomeInfo(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.providerHomeService.getHomeInfo(userId);
  }

  @Get('attributue-title-types')
  getHomeAttributes() {
    return this.providerHomeService.getHomeAttributes();
  }
}
