import { HttpStatus, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { AppointmentProposalService } from '../appointment/services/appointment-proposal.service';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import {
  ProviderBackgourndCheckEnum,
  SubscriptionPlanSlugs,
  SubscriptionStatusEnum,
} from '../subscriptions/entities/subscription.entity';

@Injectable()
export class StripeWebhooksService {
  stripe: Stripe;
  private stripeWebhookSecret: string;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
    private appointmentProposalService: AppointmentProposalService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });

    this.stripeWebhookSecret =
      this.secretService.getStripeCreds().webhookSecret;
  }

  /**
   * Deprecated
   */
  async stripeInvoiceCreated(invoiceData: Stripe.Invoice) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { email: invoiceData.customer_email, deletedAt: null },
        include: {
          userStripeCustomerAccount: true,
        },
      });

      throwBadRequestErrorCheck(!user, 'User not found');

      throwBadRequestErrorCheck(
        user?.userStripeCustomerAccount?.stripeCustomerId !=
          invoiceData.customer,
        'Customer not found',
      );

      let tempSubId: string;

      if (typeof invoiceData.subscription == 'string') {
        tempSubId = invoiceData.subscription;
      } else if (typeof invoiceData.subscription == 'object') {
        tempSubId = invoiceData.subscription.id;
      }

      const subscription = await this.prismaService.userSubscriptions.findFirst(
        {
          where: {
            stripeSubscriptionId: tempSubId,
            deletedAt: null,
          },
        },
      );

      throwBadRequestErrorCheck(!subscription, 'Subscription not found');

      const invoice = await this.prismaService.userSubscriptionInvoices.create({
        data: {
          userId: user?.id,
          userSubscriptionId: subscription?.id,
          stripeInvoiceId: invoiceData?.id,
          customerStripeId: user?.userStripeCustomerAccount?.stripeCustomerId,
          customerEmail: invoiceData?.customer_email,
          customerName: invoiceData?.customer_name,
          total: invoiceData?.total / 100,
          subTotal: invoiceData?.subtotal / 100,
          amountDue: invoiceData?.amount_due / 100,
          amountPaid: invoiceData?.amount_paid / 100,
          amountRemaining: invoiceData?.amount_remaining / 100,
          billingReason: invoiceData?.billing_reason,
          currency: invoiceData?.currency,
          paid: invoiceData?.paid,
          status: invoiceData?.status,
          src: Object(invoiceData),
        },
      });
      throwBadRequestErrorCheck(!invoice, 'Invoice not created');
      return {
        statusCode: HttpStatus.OK,
        message: 'Successful!',
      };
    } catch (e) {
      throw e as Error;
    }
  }

  async stripeInvoiceAlteration(invoiceData: Stripe.Invoice) {
    try {
      let tempSubId: string;

      if (typeof invoiceData.subscription == 'string') {
        tempSubId = invoiceData.subscription;
      } else if (typeof invoiceData.subscription == 'object') {
        tempSubId = invoiceData.subscription.id;
      }

      const subscription =
        await this.prismaService.userSubscriptions.findUnique({
          where: { stripeSubscriptionId: tempSubId },
        });
      throwBadRequestErrorCheck(!subscription, 'Subscription not found');

      const user = await this.prismaService.user.findFirst({
        where: { id: subscription?.userId, deletedAt: null },
        include: {
          userStripeCustomerAccount: true,
        },
      });

      throwBadRequestErrorCheck(!user, 'User not found');

      throwBadRequestErrorCheck(
        user?.userStripeCustomerAccount?.stripeCustomerId !=
          invoiceData.customer,
        'Customer not found',
      );

      const invoice = await this.prismaService.userSubscriptionInvoices.update({
        where: { stripeInvoiceId: invoiceData?.id },
        data: {
          customerStripeId: user?.userStripeCustomerAccount?.stripeCustomerId,
          customerEmail: invoiceData?.customer_email,
          customerName: invoiceData?.customer_name,
          total: invoiceData?.total / 100,
          subTotal: invoiceData?.subtotal / 100,
          amountDue: invoiceData?.amount_due / 100,
          amountPaid: invoiceData?.amount_paid / 100,
          amountRemaining: invoiceData?.amount_remaining / 100,
          billingReason: invoiceData?.billing_reason,
          currency: invoiceData?.currency,
          paid: invoiceData?.paid,
          status: invoiceData?.status,
          billingDate: invoiceData?.paid ? new Date() : null,
          invoicePdf: invoiceData?.invoice_pdf ?? null,
          src: Object(invoiceData),
        },
      });
      throwBadRequestErrorCheck(!invoice, 'Invoice not updated');
      return {
        statusCode: HttpStatus.OK,
        message: 'Successful!',
      };
    } catch (e) {
      throw e as Error;
    }
  }

  async customerSubscriptionUpdated(subData: Stripe.Subscription) {
    try {
      const {
        id,
        current_period_start,
        current_period_end,
        customer,
        status,
        latest_invoice,
      } = subData;

      const customerSubs =
        await this.prismaService.userSubscriptions.findUnique({
          where: { stripeSubscriptionId: id },
        });
      throwBadRequestErrorCheck(!customerSubs, 'Subscription not found');

      let tempCustomerId: string;

      if (typeof customer == 'string') {
        tempCustomerId = customer;
      } else if (typeof customer == 'object') {
        tempCustomerId = customer.id;
      }

      const userStripe =
        await this.prismaService.userStripeCustomerAccount.findFirst({
          where: {
            userId: customerSubs?.userId,
            stripeCustomerId: tempCustomerId,
          },
        });
      throwBadRequestErrorCheck(!userStripe, 'Customer not found');

      let tempLatestInvoiceStatus: string;
      if (typeof latest_invoice == 'string') {
        const invoice = await this.stripe.invoices.retrieve(latest_invoice);
        tempLatestInvoiceStatus = invoice.status;
      } else {
        tempLatestInvoiceStatus = latest_invoice.status;
      }

      await this.prismaService.userSubscriptions.update({
        where: { stripeSubscriptionId: id },
        data: {
          currentPeriodStart: new Date(current_period_start * 1000),
          currentPeriodEnd: new Date(current_period_end * 1000),
          status: status,
          paymentStatus: tempLatestInvoiceStatus,
          src: Object(subData),
        },
      });
      return {
        statusCode: HttpStatus.OK,
        data: 'Successful',
      };
    } catch (e) {
      throw e as Error;
    }
  }

  async customerSubscriptionCanceled(subData: Stripe.Subscription) {
    try {
      const { id, current_period_start, current_period_end, status } = subData;

      const customerSubs =
        await this.prismaService.userSubscriptions.findUnique({
          where: { stripeSubscriptionId: id },
        });
      throwBadRequestErrorCheck(!customerSubs, 'Subscription not found');

      await this.prismaService.userSubscriptions.update({
        where: { stripeSubscriptionId: id },
        data: {
          currentPeriodStart: new Date(current_period_start * 1000),
          currentPeriodEnd: new Date(current_period_end * 1000),
          status: status,
          src: Object(subData),
        },
      });

      const priceObject =
        await this.prismaService.membershipPlanPrices.findFirst({
          where: {
            membershipPlan: {
              slug: SubscriptionPlanSlugs.BASIC,
            },
            deletedAt: null,
          },
        });

      throwBadRequestErrorCheck(!priceObject, 'Price not found');

      const userSubs = await this.prismaService.userSubscriptions.findFirst({
        where: {
          userId: customerSubs?.userId,
          membershipPlanPriceId: priceObject?.id,
          status: SubscriptionStatusEnum.active,
        },
      });

      if (!userSubs) {
        const endDate: Date = new Date();
        endDate.setMonth(endDate.getMonth() + 60);
        await this.prismaService.$transaction([
          this.prismaService.userSubscriptions.create({
            data: {
              userId: customerSubs?.userId,
              membershipPlanPriceId: priceObject.id,
              status: SubscriptionStatusEnum.active,
              paymentStatus: 'paid',
              currentPeriodStart: new Date(),
              currentPeriodEnd: endDate,
              currency: 'usd',
            },
          }),
          this.prismaService.provider.update({
            where: {
              userId: customerSubs?.userId,
            },
            data: {
              subscriptionType: 'BASIC',
            },
          }),
        ]);
      }
      return {
        statusCode: HttpStatus.OK,
        data: 'Successful',
      };
    } catch (e) {
      throw e as Error;
    }
  }

  async chargeSucceeded(charge: Stripe.Charge) {
    const {
      id,
      payment_intent,
      paid,
      status,
      payment_method_details,
      metadata,
    } = Object(charge);

    const { type } = metadata;

    if (type == 'appointment_payment') {
      const { userId, billingId, providerId } = metadata;
      const appointmentBillingPayments =
        await this.prismaService.appointmentBillingPayments.findFirst({
          where: {
            piId: payment_intent,
            billingId: BigInt(billingId),
            paidByUserId: BigInt(userId),
          },
        });

      throwBadRequestErrorCheck(
        !appointmentBillingPayments,
        'Payment history not found',
      );

      const provider = await this.prismaService.provider.findFirst({
        where: {
          id: BigInt(providerId),
        },
      });
      throwBadRequestErrorCheck(!provider, 'Provider not found');

      const billing = await this.prismaService.billing.findFirst({
        where: {
          id: BigInt(billingId),
        },
        include: {
          appointment: {
            include: {
              appointmentProposal: {
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          },
        },
      });

      throwBadRequestErrorCheck(!billing, 'Billing not found');

      await this.prismaService.$transaction([
        this.prismaService.appointmentBillingPayments.update({
          where: { id: appointmentBillingPayments?.id },
          data: {
            chargeId: id,
            status: status,
            src: Object(payment_method_details),
            billingDate: new Date(),
          },
        }),
        this.prismaService.billing.update({
          where: { id: BigInt(billingId) },
          data: {
            paid: true,
            paymentStatus: 'paid',
          },
        }),
        this.prismaService.appointment.update({
          where: { id: billing?.appointmentId },
          data: {
            status: 'PAID',
          },
        }),
      ]);

      let providerPercentage = 0;

      if (provider?.subscriptionType === 'BASIC') {
        providerPercentage = 91;
      } else if (provider?.subscriptionType === 'GOLD') {
        providerPercentage = 98;
      } else if (provider?.subscriptionType === 'PLATINUM') {
        providerPercentage = 100;
      }

      const providerAmount = Number(
        ((billing?.subtotal * providerPercentage) / 100)?.toFixed(2),
      );

      const releaseDate = new Date();
      releaseDate.setDate(releaseDate.getDate() + 3);

      const appointmentBillingTransactions =
        await this.prismaService.appointmentBillingTransactions.create({
          data: {
            billingId: BigInt(billingId),
            providerId: BigInt(providerId),
            paidAmount: appointmentBillingPayments?.amount,
            currency: appointmentBillingPayments?.currency,
            providerSubsStatus: provider?.subscriptionType,
            providerPercentage: providerPercentage,
            providerAmount: providerAmount,
            releaseDate: releaseDate,
          },
        });

      throwBadRequestErrorCheck(
        !appointmentBillingTransactions,
        'Could not create transaction',
      );

      const date = await this.appointmentProposalService.getProposalPrice(
        billing?.appointment?.opk,
      );

      const dateDatas = date.formatedDatesByZone.map((item) => {
        return {
          date: new Date(item?.date),
          appointmentId: billing?.appointment?.id,
          appointmentProposalId:
            billing?.appointment?.appointmentProposal[0]?.id,
          day: item?.day,
          isHoliday: item?.isHoliday,
          holidayNames: item?.holidayNames,
          durationInMinutes:
            billing?.appointment?.appointmentProposal[0]?.length ?? null,
        };
      });

      await this.prismaService.appointmentDates.createMany({
        data: dateDatas,
      });

      return {
        message: 'Charge Succeeded',
      };
    } else if (type == 'default_verification') {
      const { userId } = metadata;
      const provider = await this.prismaService.provider.findFirst({
        where: {
          userId: BigInt(userId),
          deletedAt: null,
        },
      });

      if (payment_intent?.status == 'succeeded') {
        await this.prismaService.provider.update({
          where: {
            id: provider?.id,
          },
          data: {
            backGroundCheck: ProviderBackgourndCheckEnum.BASIC,
          },
        });
      }

      const userMiscellenous =
        await this.prismaService.miscellaneousPayments.findFirst({
          where: {
            userId: BigInt(userId),
            type: 'DEFAULT_VERIFICATION',
            piId: payment_intent,
          },
        });

      const updateUserMiscellenous =
        await this.prismaService.miscellaneousPayments.update({
          where: {
            id: userMiscellenous?.id,
          },
          data: {
            chargeId: id,
            status: status,
            paid: paid,
            src: payment_method_details,
            billingDate: new Date(),
          },
        });

      throwBadRequestErrorCheck(
        !updateUserMiscellenous,
        'Miscellenous payment can not be updated.',
      );

      return {
        message: 'Charge Succeeded',
      };
    } else {
      return {
        message: 'Charge Succeeded for other methods',
      };
    }
  }

  async chargeFailed(charge: Stripe.Charge) {
    const {
      id,
      payment_intent,
      paid,
      status,
      payment_method_details,
      metadata,
      outcome,
    } = Object(charge);

    const { type, userId } = metadata;

    if (type == 'appointment_payment') {
      const { userId, billingId } = metadata;
      const appointmentBillingPayments =
        await this.prismaService.appointmentBillingPayments.findFirst({
          where: {
            piId: payment_intent,
            billingId: BigInt(billingId),
            paidByUserId: BigInt(userId),
          },
        });

      throwBadRequestErrorCheck(
        !appointmentBillingPayments,
        'Payment history not found',
      );

      const paymentUpdate =
        await this.prismaService.appointmentBillingPayments.update({
          where: { id: appointmentBillingPayments?.id },
          data: {
            chargeId: id,
            status: status,
            src: Object(payment_method_details),
            billingDate: new Date(),
            deletedAt: new Date(),
            meta: outcome,
          },
        });
      throwBadRequestErrorCheck(
        !paymentUpdate,
        'Appointment payment failure can not be updated.',
      );

      return {
        message: 'Charge Failed',
      };
    } else if (type == 'default_verification') {
      const userMiscellenous =
        await this.prismaService.miscellaneousPayments.findFirst({
          where: {
            userId: BigInt(userId),
            type: 'DEFAULT_VERIFICATION',
            piId: payment_intent,
          },
        });

      const updateUserMiscellenous =
        await this.prismaService.miscellaneousPayments.update({
          where: {
            id: userMiscellenous?.id,
          },
          data: {
            chargeId: id,
            status: status,
            paid: paid,
            src: payment_method_details,
            billingDate: new Date(),
            deletedAt: new Date(),
            meta: outcome,
          },
        });

      throwBadRequestErrorCheck(
        !updateUserMiscellenous,
        'Miscellenous payment can not be updated.',
      );

      return {
        message: 'Charge Failed',
      };
    } else {
      return {
        message: 'Charge failed for other methods',
      };
    }
  }

  async stripeWebhook(stripeSignature: any, body: any) {
    let event: any;
    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        stripeSignature,
        this.stripeWebhookSecret,
      );
    } catch (e) {
      console.log(e);
      throw e as Error;
    }

    // console.log('Stripe Event', event);

    switch (event.type) {
      case 'charge.succeeded':
        console.log('Charge Succeeded');
        return await this.chargeSucceeded(event.data.object);
      case 'charge.failed':
        console.log('Charge Failed');
        return await this.chargeFailed(event.data.object);
      case 'customer.subscription.updated':
        console.log('Customer Subscription Updated');
        return await this.customerSubscriptionUpdated(event.data.object);
      case 'customer.subscription.deleted':
        console.log('Customer Subscription Deleted');
        return await this.customerSubscriptionCanceled(event.data.object);
      case 'invoice.updated':
        console.log('Invoice updated');
        return await this.stripeInvoiceAlteration(event.data.object);
      case 'invoice.payment_succeeded':
        console.log('Invoice Payment Succeeded');
        return await this.stripeInvoiceAlteration(event.data.object);
      case 'invoice.finalized':
        console.log('Invoice Finalized');
        return await this.stripeInvoiceAlteration(event.data.object);
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid event type',
        };
    }
  }
}
