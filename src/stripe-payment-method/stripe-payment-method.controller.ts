import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StripePaymentMethodService } from './stripe-payment-method.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddCardDto, CreateTokenDto } from './dto/add-card.dto';

@ApiTags('Stripe Payment Method')
@Controller('stripe-payment-method')
export class StripePaymentMethodController {
  constructor(
    private readonly stripePaymentMethodService: StripePaymentMethodService,
  ) {}

  @ApiOperation({
    summary:
      'Check if the customer is created or not. If not, it creates the customer.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/customers')
  create(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripePaymentMethodService.getOrCreateCustomer(userId);
  }

  @ApiOperation({
    summary: 'For Backend/Test purpose only!',
  })
  @Post('/create-card-token')
  createCardToken(@Body() createTokenDto: CreateTokenDto) {
    return this.stripePaymentMethodService.createCardToken(createTokenDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/add-card')
  addCard(@Body() addCardDto: AddCardDto, @Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripePaymentMethodService.addCard(userId, addCardDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/all-cards')
  getAllCards(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripePaymentMethodService.getAllCards(userId);
  }
}
