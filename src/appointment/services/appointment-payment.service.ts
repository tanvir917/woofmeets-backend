import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { CommonService } from '../../common/common.service';
import {
  throwBadRequestErrorCheck,
  throwConflictErrorCheck,
} from '../../global/exceptions/error-logic';
import { PrismaService } from '../../prisma/prisma.service';
import { SecretService } from '../../secret/secret.service';
import { AppointmentListsQueryParamsDto } from '../dto/appointment-query.dto';

@Injectable()
export class AppointmentPaymentService {
  stripe: Stripe;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
    private commonService: CommonService,
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
        throwConflictErrorCheck(true, 'idempotency_key_in_use');
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
        switch (paymentIntent.status) {
          case 'succeeded':
            return {
              message: 'Payment successful',
              data: {
                requiresAction: false,
              },
            };
          case 'requires_action':
            return {
              message: 'Payment requires action.',
              data: {
                requiresAction: true,
                clientSecret: paymentIntent?.client_secret,
              },
            };
          case 'processing':
            return {
              message: 'Payment already processing. Please wait some time.',
              data: {
                requiresAction: false,
              },
            };
          default:
            throwConflictErrorCheck(true, 'Payment failed. Please try again.');
        }
      }
    }

    /**
     * TxnId generation
     */

    let txnNumber = this.commonService.getInvoiceNumber();
    let txnNumberGenerated = false;
    while (!txnNumberGenerated) {
      const checkTxnNumber =
        await this.prismaService.appointmentBillingPayments.findFirst({
          where: {
            txnId: txnNumber,
          },
        });
      if (checkTxnNumber) {
        txnNumber = this.commonService.getInvoiceNumber();
      } else {
        txnNumberGenerated = true;
      }
    }

    await this.prismaService.appointmentBillingPayments.create({
      data: {
        billingId: billing?.id,
        paidByUserId: user?.id,
        txnId: txnNumber,
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
    } else if (paymentIntent?.status === 'processing') {
      return {
        message: 'Payment processing. Please wait some time.',
        data: {
          requiresAction: false,
        },
      };
    }

    throwBadRequestErrorCheck(true, 'Payment failed.');
  }

  async getAppointmentListsWithPaymentsForUser(
    userId: bigint,
    query: AppointmentListsQueryParamsDto,
  ) {
    let { page, limit, sortBy, sortOrder } = query;
    const orderbyObj = {};

    if (!page || page < 1) page = 1;
    if (!limit) limit = 20;
    if (!sortOrder && sortOrder != 'asc' && sortOrder != 'desc')
      sortOrder = 'desc';
    if (!sortBy) sortBy = 'createdAt';

    orderbyObj[sortBy] = sortOrder;

    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    const [count, appointments] = await this.prismaService.$transaction([
      this.prismaService.appointment.findMany({
        where: {
          userId: userId,
        },
        orderBy: orderbyObj,
        include: {
          billing: {
            include: {
              appointmentBillingPayments: {
                where: {
                  status: 'succeeded',
                },
                select: {
                  id: true,
                  amount: true,
                  currency: true,
                  status: true,
                  payerEmail: true,
                  billingDate: true,
                },
              },
            },
          },
        },
      }),
      this.prismaService.appointment.findMany({
        where: {
          userId: userId,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: orderbyObj,
        include: {
          billing: {
            include: {
              appointmentBillingPayments: {
                where: {
                  status: 'succeeded',
                },
                select: {
                  id: true,
                  amount: true,
                  currency: true,
                  status: true,
                  payerEmail: true,
                  billingDate: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      message: 'Appointment lists with payments',
      data: {
        appointments: appointments,
      },
      meta: {
        total: count.length,
        page: page,
        limit: limit,
      },
    };
  }
}