import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentDispatcherQueryDto } from './dto/payment-dispatcher-query.dto';
import { PaymentDispatcherBlockedDto } from './dto/payment-dispatcher.dto';
import { PaymentDispatcherService } from './payment-dispatcher.service';

@ApiTags('Payment Dispatcher')
@Controller('payment-dispatcher')
export class PaymentDispatcherController {
  constructor(
    private readonly paymentDispatcherService: PaymentDispatcherService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('get-all-transactions')
  async getAllTransactions(@Request() req: any) {
    const userId: string = req.user.id ?? '-1';
    return await this.paymentDispatcherService.getAllAppointmentBillingTransactions(
      BigInt(userId),
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('get-single-transaction-info/:billingTransactionId')
  async getSingleBillingTransactionInfo(
    @Request() req: any,
    @Query('billingTransactionId') billingTransactionId: string,
  ) {
    const userId: string = req.user.id ?? '-1';
    return await this.paymentDispatcherService.sigleAppointmentBillingTransaction(
      BigInt(userId),
      BigInt(billingTransactionId),
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('Transfer-payment-to-provider/:billingTransactionId')
  async transferPaymentToProvider(
    @Param('billingTransactionId') billingTransactionId: string,
    @Request() req: any,
  ) {
    const userId: string = req.user.id ?? '-1';
    return await this.paymentDispatcherService.paySingleBillingTransaction(
      BigInt(userId),
      BigInt(billingTransactionId),
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('change-locked-status/:billingTransactionId')
  async changeLockedStatusByAdmin(
    @Param('billingTransactionId') billingTransactionId: string,
    @Request() req: any,
    @Body() body: PaymentDispatcherBlockedDto,
  ) {
    const userId: string = req.user.id ?? '-1';
    return await this.paymentDispatcherService.changeLockedStatusByAdmin(
      BigInt(userId),
      BigInt(billingTransactionId),
      body,
    );
  }
}
