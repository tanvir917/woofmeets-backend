import {
  Controller,
  Get,
  UseInterceptors,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';
import { BalancesService } from './balances.service';
import { GetBalancesQueryDto } from './dto/get-balances-query.dto';

@ApiTags('Balances')
@UseInterceptors(TransformInterceptor)
@Controller('balances')
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('pet-owner')
  async findPetOwnerPaymentHistory(
    @Request() req: any,
    @Query() query: GetBalancesQueryDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.balancesService.findPetOwnerPaymentHistory(userId, query);
  }

  @ApiOperation({
    summary: 'Get pet sitter payment history',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('pet-sitter')
  async findPetSitterPaymentHistory(
    @Request() req: any,
    @Query() query: GetBalancesQueryDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.balancesService.findPetSitterPaymentHistory(userId, query);
  }
}
