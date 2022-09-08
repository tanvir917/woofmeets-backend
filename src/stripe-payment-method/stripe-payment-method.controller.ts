import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { StripePaymentMethodService } from './stripe-payment-method.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddCardDto, CreateTokenDto } from './dto/add-card.dto';
import { TransformInterceptor } from '../transform.interceptor';
import { UpdateCardDto } from './dto/update-card.dto';

@ApiTags('Stripe Payment Method')
@UseInterceptors(TransformInterceptor)
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

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('/all-cards/:cardId')
  updateCardInfo(
    @Request() req: any,
    @Param('cardId') cardId: string,
    @Body() updateCardDto: UpdateCardDto,
  ) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripePaymentMethodService.updateCustomerCard(
      userId,
      BigInt(cardId),
      updateCardDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/default-card-info')
  getDefaultCardInfo(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripePaymentMethodService.getDefaultCardInfo(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('/all-cards/:cardId/change-default-card')
  makeCardDefault(@Request() req: any, @Param('cardId') cardId: string) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripePaymentMethodService.makeCardDefault(
      userId,
      BigInt(cardId),
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('/customer/all-cards/:cardId')
  deleteCard(@Request() req: any, @Param('cardId') cardId: string) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripePaymentMethodService.deleteCustomerCard(
      userId,
      BigInt(cardId),
    );
  }
}
