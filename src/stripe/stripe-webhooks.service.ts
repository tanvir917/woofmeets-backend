import { HttpStatus, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { ProviderBackgourndCheckEnum } from '../subscriptions/entities/subscription.entity';

@Injectable()
export class StripeWebhooksService {
  stripe: Stripe;
  private stripeWebhookSecret: string;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });

    this.stripeWebhookSecret =
      this.secretService.getStripeCreds().webhookSecret;
  }

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

      /**
       * TODO: Check if invoice finalize doesn't have subscription id
       */

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

  async chargeSucceeded(charge: Stripe.Charge) {
    const {
      id,
      payment_intent,
      paid,
      status,
      payment_method_details,
      metadata,
    } = Object(charge);

    const { type, userId } = metadata;

    if (type == 'default_verification') {
      const provider = await this.prismaService.provider.findFirst({
        where: {
          userId: BigInt(userId),
          deletedAt: null,
        },
      });
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

      await this.prismaService.provider.update({
        where: {
          id: provider?.id,
        },
        data: {
          backGroundCheck: ProviderBackgourndCheckEnum.BASIC,
        },
      });

      return {
        message: 'Charge Succeeded',
      };
    } else {
      return {
        message: 'Charge Succeeded for other methods',
      };
    }
  }

  private async handleAccontUpdated(account: object) {
    const {
      id,
      charges_enabled,
      payouts_enabled,
      details_submitted,
      requirements,
      type,
      future_requirements,
      capabilities,
      country,
      default_currency,
      email,
    } = Object(account);

    const stripeAccount =
      await this.prismaService.userStripeConnectAccount.findFirst({
        where: {
          stripeAccountId: id,
          deletedAt: null,
        },
      });

    throwBadRequestErrorCheck(!stripeAccount, 'Account not found!');

    const accountUpdated =
      await this.prismaService.userStripeConnectAccount.update({
        where: { id: stripeAccount?.id },
        data: {
          country: country,
          defaultCurrency: default_currency,
          chargesEnabled: charges_enabled,
          payoutsEnabled: payouts_enabled,
          detailsSubmitted: details_submitted,
          requirements: requirements,
          futureRequirements: future_requirements,
          capabilities: capabilities,
          email,
          type,
        },
      });

    throwBadRequestErrorCheck(!accountUpdated, 'Account can not be updated!');

    return {
      message: 'Account Updated!',
    };
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
      case 'customer.subscription.updated':
        console.log('Customer Subscription Updated');
        return await this.customerSubscriptionUpdated(event.data.object);
      case 'invoice.updated':
        console.log('Invoice updated');
        return await this.stripeInvoiceAlteration(event.data.object);
      case 'invoice.payment_succeeded':
        console.log('Invoice Payment Succeeded');
        return await this.stripeInvoiceAlteration(event.data.object);
      case 'invoice.finalized':
        console.log('Invoice Finalized');
        return await this.stripeInvoiceAlteration(event.data.object);
      case 'account.updated':
        return this.handleAccontUpdated(event.data.object);
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid event type',
        };
    }
  }
}
