import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';
import { CancellationPolicyService } from './cancellation-policy.service';

@ApiTags('Cancellation Policy')
@UseInterceptors(TransformInterceptor)
@Controller('cancellation-policy')
export class CancellationPolicyController {
  constructor(
    private readonly cancellationPolicyService: CancellationPolicyService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('provider-policy/:policyId')
  createOrUpdate(@Param('policyId') policyId: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.cancellationPolicyService.createOrUpdate(userId, +policyId);
  }

  @Get()
  findAll() {
    return this.cancellationPolicyService.findAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('povider-policy')
  findOne(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.cancellationPolicyService.findProviderPolicy(userId);
  }
}
