import { HttpStatus, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import {
  throwBadRequestErrorCheck,
  throwConflictErrorCheck,
} from '../../global/exceptions/error-logic';
import { PrismaService } from '../../prisma/prisma.service';
import { SecretService } from '../../secret/secret.service';

@Injectable()
export class AppointmentPaymentService {
  stripe: Stripe;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });
  }

  async payAppointmentBilling(
    userId: bigint,
    opk: string,
    billingId: bigint,
    cardId: bigint,
    idempontencyKey: string,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        userStripeCustomerAccount: true,
        userStripeCard: {
          where: {
            id: cardId,
            deletedAt: null,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(
      !user?.userStripeCard?.length,
      'No card found. Please check again or try with another card.',
    );

    const appointment = await this.prismaService.appointment.findUnique({
      where: {
        opk: opk,
      },
    });

    throwBadRequestErrorCheck(!appointment, 'Appointment not found');

    const billing = await this.prismaService.billing.findFirst({
      where: {
        id: billingId,
        appointmentId: appointment?.id,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!billing, 'Billing not found');

    throwBadRequestErrorCheck(billing?.paid, 'Billing already paid');

    throwBadRequestErrorCheck(
      typeof billing?.total !== 'number',
      'Invalid billing amount',
    );

    const amount = Number(billing?.total?.toFixed(2));

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await this.stripe.paymentIntents.create(
        {
          amount: Math.round(amount * 100),
          currency: 'usd',
          payment_method: user?.userStripeCard[0].stripeCardId,
          customer: user?.userStripeCustomerAccount?.stripeCustomerId,
          confirm: true,
          metadata: {
            type: 'appointment_payment',
            userId: user?.id.toString(),
            billingId: billing?.id.toString(),
            appointmentId: appointment?.id.toString(),
            providerId: appointment?.providerId.toString(),
          },
        },
        { idempotencyKey: idempontencyKey },
      );
    } catch (error) {
      if (error?.code == 'idempotency_key_in_use') {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Idempotency key already in use',
          data: {
            status: 'idempotency_key_in_use',
          },
        };
      }
      throwBadRequestErrorCheck(true, error?.message);
    }

    const prevPayments =
      await this.prismaService.appointmentBillingPayments.findFirst({
        where: {
          piId: paymentIntent?.id,
        },
      });

    if (prevPayments) {
      if (prevPayments?.status === 'succeeded') {
        throwBadRequestErrorCheck(true, 'Payment already done');
      } else {
        throwConflictErrorCheck(true, 'Payment failed. Please try again.');
      }
    }

    await this.prismaService.appointmentBillingPayments.create({
      data: {
        billingId: billing?.id,
        paidByUserId: user?.id,
        piId: paymentIntent?.id,
        amount: paymentIntent?.amount / 100,
        payerEmail: user?.email,
        currency: paymentIntent?.currency,
        status: paymentIntent?.status,
        src: paymentIntent?.payment_method_types,
      },
    });

    if (paymentIntent?.status === 'succeeded') {
      return {
        message: 'Payment successful',
        data: {
          requiresAction: false,
        },
      };
    } else if (paymentIntent?.status === 'requires_action') {
      return {
        message: 'Payment requires action.',
        data: {
          requiresAction: true,
          clientSecret: paymentIntent?.client_secret,
        },
      };
    }

    throwBadRequestErrorCheck(true, 'Payment failed.');
  }
}
