import { PartialType } from '@nestjs/swagger';
import { CreateStripePaymentMethodDto } from './create-stripe-payment-method.dto';

export class UpdateStripePaymentMethodDto extends PartialType(CreateStripePaymentMethodDto) {}
