import {
  Controller,
  Post,
  UseInterceptors,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';
import { CheckrService } from './checkr.service';

@ApiTags('Checkr')
@UseInterceptors(TransformInterceptor)
@Controller('checkr')
export class CheckrController {
  constructor(private readonly checkrService: CheckrService) {}

  @ApiOperation({
    summary: 'Subscription creation api.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    // return this.checkrService.create(userId);
  }
}
