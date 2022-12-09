import { Injectable } from '@nestjs/common';
import { AppointmentBillingTransactions } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { PaginationQueryParamsDto } from 'src/admin-panel/dto/pagination-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import {
  isStringDate,
  isStringNumeric,
} from 'src/utils/tools/date-number.checker';
import Stripe from 'stripe';
import { AdminPanelService } from '../admin-panel/admin-panel.service';
import {
  throwBadRequestErrorCheck,
  throwUnauthorizedErrorCheck,
} from '../global/exceptions/error-logic';
import { PaymentDispatcherBlockedDto } from './dto/payment-dispatcher.dto';
import {
  APPOINTMENT_BILLING_NEXT_STATE,
  APPOINTMENT_BILLING_STATES,
  CurrencyTypes,
} from './types';

type PayoutParams = {
  billingId: string;
  amount: number;
  payoutDestination: string;
  idempotencyKey?: string;
};

type SinglePayoutParams = {
  billingId: string;
  billingTransactionId: bigint;
  amount: number;
  payoutDestination: string;
  idempotencyKey?: string;
};

@Injectable()
export class PaymentDispatcherService {
  stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
    private readonly secret: SecretService,
    private adminPanelService: AdminPanelService,
  ) {
    const { secretKey, apiVersion } = this.secret.getStripeCreds();

    this.stripe = new Stripe(secretKey, {
      apiVersion: apiVersion,
    });

    this.logger.setContext(PaymentDispatcherService.name);
  }

  /**
   * TODO: Needs to unloack the transaction if it fails
   */

  async getEligiblePayoutCandidates() {
    try {
      const awaitingPayouts = await this.prisma.$transaction(
        async (prisma) => {
          const transferrable =
            await prisma.appointmentBillingTransactions.findMany({
              where: {
                provider: {
                  user: {
                    userStripeConnectAccount: {
                      payoutsEnabled: true, //added this line and below one to fileter out the providers who have not connected
                      chargesEnabled: true, // their stripe account. Else it will not transfer the money.
                    },
                  },
                },
                releaseStatus: false,
                lockedAt: null,
                releaseDate: {
                  lte: new Date(),
                },
                deletedAt: null,
              },
              select: {
                id: true,
              },
            });

          const ids = transferrable.map(({ id }) => id);

          await prisma.appointmentBillingTransactions.updateMany({
            where: {
              id: {
                in: ids,
              },
            },
            data: {
              lockedAt: new Date(),
              nextState: APPOINTMENT_BILLING_NEXT_STATE.PAYING_OUT,
            },
          });

          return prisma.appointmentBillingTransactions.findMany({
            where: {
              id: {
                in: ids,
              },
            },
            select: {
              id: true,
              providerAmount: true,
              exchangeRate: true,
              currency: true,
              provider: {
                select: {
                  user: {
                    select: {
                      userStripeConnectAccount: {
                        select: {
                          stripeAccountId: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          });
        },
        {
          isolationLevel: 'Serializable',
          maxWait: 5000,
        },
      );

      for (const payoutItem of awaitingPayouts) {
        const payoutDestination =
          payoutItem?.provider?.user?.userStripeConnectAccount?.stripeAccountId;

        // Calculating the exchange rate if currency is not USD
        const tempAmount =
          payoutItem?.currency != CurrencyTypes.USD
            ? payoutItem?.providerAmount * payoutItem?.exchangeRate
            : payoutItem?.providerAmount;

        const result = await this.payout({
          billingId: payoutItem.id.toString(),
          amount: tempAmount,
          payoutDestination: payoutDestination,
        });

        if (!result) {
          this.logger.error(
            `Skipping dispatching appointment payout ${payoutItem.id}`,
          );
          continue;
        }

        await this.prisma.appointmentBillingTransactions.update({
          where: {
            id: payoutItem.id,
          },
          data: {
            nextState: null,
            releaseStatus: true,
            state: APPOINTMENT_BILLING_STATES.PAID_OUT,
            lockedAt: null,
          },
        });
      }

      return awaitingPayouts;
    } catch (error) {
      this.logger.error(error);
    }
  }

  async payout({
    billingId,
    amount,
    payoutDestination,
    idempotencyKey,
  }: PayoutParams) {
    try {
      const transfersList = await this.stripe.transfers.list({
        transfer_group: billingId,
        limit: 1,
      });

      const previousTransfer = transfersList?.data?.[0];

      if (!!previousTransfer) {
        return previousTransfer;
      }
    } catch (error) {
      this.logger.error('Existing checking stripe transfer list failed');
      this.logger.error(error);
    }

    try {
      const transfer = await this.stripe.transfers.create(
        {
          transfer_group: billingId,
          amount: Math.round(amount * 100),
          currency: 'usd',
          destination: payoutDestination,
        },
        {
          idempotencyKey: idempotencyKey,
        },
      );

      return transfer;
    } catch (error) {
      this.logger.error('Stripe Payment Transfer Failed');
      this.logger.error(error);
      return null;
    }
  }

  /**
   * Routes for Single Payout
   */

  async singlePayout({
    billingId,
    billingTransactionId,
    amount,
    payoutDestination,
    idempotencyKey,
  }: SinglePayoutParams) {
    try {
      const transfersList = await this.stripe.transfers.list({
        transfer_group: `${billingId}-${billingTransactionId}`,
        limit: 1,
      });

      const previousTransfer = transfersList?.data?.[0];

      if (!!previousTransfer) {
        return previousTransfer;
      }
    } catch (error) {
      this.logger.error('Existing checking stripe transfer list failed');
      this.logger.error(error);
      await this.prisma.appointmentBillingTransactions.update({
        where: {
          id: billingTransactionId,
        },
        data: {
          errors: error,
        },
      });
      return null;
    }

    try {
      const transfer = await this.stripe.transfers.create(
        {
          transfer_group: `${billingId}-${billingTransactionId}`,
          amount: Math.round(amount * 100),
          currency: 'usd',
          destination: payoutDestination,
        },
        {
          idempotencyKey: idempotencyKey,
        },
      );

      return transfer;
    } catch (error) {
      this.logger.error('Stripe Payment Transfer Failed');
      this.logger.error(error);
      await this.prisma.appointmentBillingTransactions.update({
        where: {
          id: billingTransactionId,
        },
        data: {
          errors: error,
        },
      });
      return null;
    }
  }

  async preparingForPayouts(billingTransactionId: bigint) {
    try {
      const awaitingPayout = await this.prisma.$transaction(
        async (prisma) => {
          const transferrable =
            await prisma.appointmentBillingTransactions.findFirst({
              where: {
                id: billingTransactionId,
                provider: {
                  user: {
                    userStripeConnectAccount: {
                      payoutsEnabled: true, //added this line and below one to fileter out the providers who have not connected
                      chargesEnabled: true, // their stripe account. Else it will not transfer the money.
                    },
                  },
                },
                releaseStatus: false,
                lockedAt: null,
                releaseDate: {
                  lte: new Date(),
                },
                deletedAt: null,
              },
              select: {
                id: true,
              },
            });

          const updatedTransaction =
            await prisma.appointmentBillingTransactions.update({
              where: {
                id: transferrable?.id,
              },
              data: {
                lockedAt: new Date(),
                nextState: APPOINTMENT_BILLING_NEXT_STATE.PAYING_OUT,
              },
            });
          return updatedTransaction;
        },
        {
          isolationLevel: 'Serializable',
          maxWait: 5000,
        },
      );
      return awaitingPayout;
    } catch (error) {
      this.logger.error(error);
      await this.prisma.appointmentBillingTransactions.update({
        where: {
          id: billingTransactionId,
        },
        data: {
          errors: error,
        },
      });
      return null;
    }
  }

  async paySingleBillingTransaction(
    userId: bigint,
    billingTransactionId: bigint,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    const transaction =
      await this.prisma.appointmentBillingTransactions.findFirst({
        where: {
          id: billingTransactionId,
          deletedAt: null,
        },
      });

    throwBadRequestErrorCheck(
      !transaction,
      'Transaction with this id not found',
    );

    throwBadRequestErrorCheck(
      transaction.releaseDate > new Date(),
      'Payouts are not allowed before release date',
    );

    throwBadRequestErrorCheck(!!transaction?.lockedAt, 'Transaction locked');

    throwBadRequestErrorCheck(
      transaction?.state == 'PAID_OUT' || transaction?.releaseStatus,
      'Already paid out',
    );

    const provider = await this.prisma.provider.findFirst({
      where: {
        id: transaction.providerId,
      },
      select: {
        user: {
          select: {
            userStripeConnectAccount: {
              select: {
                stripeAccountId: true,
                detailsSubmitted: true,
                payoutsEnabled: true,
                chargesEnabled: true,
                capabilities: true,
              },
            },
          },
        },
      },
    });

    const capabilitiesCheck =
      !provider?.user?.userStripeConnectAccount?.chargesEnabled ||
      !provider?.user?.userStripeConnectAccount?.payoutsEnabled;

    throwBadRequestErrorCheck(
      capabilitiesCheck,
      'Stripe connect account not ready',
    );

    let tempTransaction: AppointmentBillingTransactions;
    if (
      transaction?.state == 'CUSTOMER_PAID' &&
      transaction?.nextState == null
    ) {
      tempTransaction = await this.prisma.appointmentBillingTransactions.update(
        {
          where: {
            id: billingTransactionId,
          },
          data: {
            nextState: APPOINTMENT_BILLING_NEXT_STATE.PREPARING_FOR_PAYOUT,
          },
        },
      );
    } else {
      tempTransaction = transaction;
    }

    let BREAK_LOOP = false;

    while (
      tempTransaction?.nextState != APPOINTMENT_BILLING_NEXT_STATE.FINISHED ||
      !BREAK_LOOP
    ) {
      tempTransaction =
        await this.prisma.appointmentBillingTransactions.findUnique({
          where: {
            id: tempTransaction?.id,
          },
        });
      switch (tempTransaction?.nextState) {
        case APPOINTMENT_BILLING_NEXT_STATE.FINISHED:
          BREAK_LOOP = true;
          break;
        case APPOINTMENT_BILLING_NEXT_STATE.PREPARING_FOR_PAYOUT:
          const transResult = await this.preparingForPayouts(
            billingTransactionId,
          );
          if (!transResult) {
            BREAK_LOOP = true;
            throwBadRequestErrorCheck(
              true,
              'Error while preparing for transaction',
            );
          }
          break;
        case APPOINTMENT_BILLING_NEXT_STATE.PAYING_OUT:
          // Calculating the exchange rate if currency is not USD
          const tempAmount =
            tempTransaction?.currency != CurrencyTypes.USD
              ? tempTransaction?.providerAmount * tempTransaction?.exchangeRate
              : tempTransaction?.providerAmount;

          const payoutDestination =
            provider?.user?.userStripeConnectAccount?.stripeAccountId;
          const result = await this.singlePayout({
            billingId: tempTransaction?.billingId.toString(),
            billingTransactionId: tempTransaction?.id,
            amount: tempAmount,
            payoutDestination: payoutDestination,
            idempotencyKey: `Transfer-${tempTransaction?.billingId}-${tempTransaction?.id}`,
          });
          if (!result) {
            this.logger.error(
              `Skipping dispatching appointment payout ${tempTransaction.id}`,
            );
            throwBadRequestErrorCheck(true, 'Error while doing transfer.');
            BREAK_LOOP = true;
          }
          await this.prisma.appointmentBillingTransactions.update({
            where: {
              id: tempTransaction?.id,
            },
            data: {
              nextState: APPOINTMENT_BILLING_NEXT_STATE.UPDATE_AFTER_PAYOUT,
            },
          });
          break;
        case APPOINTMENT_BILLING_NEXT_STATE.UPDATE_AFTER_PAYOUT:
          try {
            await this.prisma.appointmentBillingTransactions.update({
              where: {
                id: tempTransaction.id,
              },
              data: {
                nextState: APPOINTMENT_BILLING_NEXT_STATE.FINISHED,
                releaseStatus: true,
                state: APPOINTMENT_BILLING_STATES.PAID_OUT,
                lockedAt: null,
              },
            });

            // TODO: Add email notification here
          } catch (error) {
            this.logger.error(error);
            throwBadRequestErrorCheck(
              true,
              'Error while updating after succesful transfer.',
            );
            BREAK_LOOP = true;
          }
          break;
        default:
          throwBadRequestErrorCheck(
            true,
            'Irregular transaction state. Please check the transaction again.',
          );
          BREAK_LOOP = true;
          break;
      }
    }
    return {
      message: 'Transaction successfully paid out',
    };
  }

  async getAllAppointmentBillingTransactions(
    userId: bigint,
    query: PaginationQueryParamsDto,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    let { page, limit, sortBy, sortOrder } = query;
    const orderbyObj = {};

    if (!page || page < 1) page = 1;
    if (!limit) limit = 20;
    if (!sortOrder && sortOrder != 'asc' && sortOrder != 'desc')
      sortOrder = 'desc';
    if (!sortBy) sortBy = 'createdAt';

    orderbyObj[sortBy] = sortOrder;

    const [appointmentBillingTransactionCount, appointmentBillingTransaction] =
      await this.prisma.$transaction([
        this.prisma.appointmentBillingTransactions.count({}),
        this.prisma.appointmentBillingTransactions.findMany({
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    id: true,
                    opk: true,
                    email: true,
                    emailVerified: true,
                    firstName: true,
                    lastName: true,
                    zipcode: true,
                    image: true,
                    loginProvider: true,
                    timezone: true,
                    facebook: true,
                    google: true,
                    meta: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                  },
                },
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: orderbyObj,
        }),
      ]);

    throwBadRequestErrorCheck(!appointmentBillingTransaction, 'No Data Found');
    return {
      message: 'Appointment Billing Transactions',
      data: { billingTransactions: appointmentBillingTransaction },
      meta: {
        total: appointmentBillingTransactionCount,
        currentPage: page,
        limit,
      },
    };
  }

  async sigleAppointmentBillingTransaction(
    userId: bigint,
    billingTransactionId: bigint,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    const appointmentBillingTransaction =
      await this.prisma.appointmentBillingTransactions.findUnique({
        where: {
          id: billingTransactionId,
        },
        include: {
          billing: {
            include: {
              appointment: {
                include: {
                  user: {
                    select: {
                      id: true,
                      opk: true,
                      email: true,
                      firstName: true,
                      lastName: true,
                      image: true,
                    },
                  },
                  providerService: {
                    include: {
                      serviceType: true,
                    },
                  },
                },
              },
            },
          },
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  opk: true,
                  email: true,
                  emailVerified: true,
                  firstName: true,
                  lastName: true,
                  zipcode: true,
                  image: true,
                  loginProvider: true,
                  timezone: true,
                  facebook: true,
                  google: true,
                  meta: true,
                  basicInfo: {
                    include: {
                      country: true,
                    },
                  },
                  createdAt: true,
                  updatedAt: true,
                  deletedAt: true,
                },
              },
            },
          },
        },
      });

    throwBadRequestErrorCheck(!appointmentBillingTransaction, 'No Data Found');

    const [appointmentProposal, appointmentDates] =
      await this.prisma.$transaction([
        this.prisma.appointmentProposal.findMany({
          where: {
            appointmentId:
              appointmentBillingTransaction?.billing?.appointment?.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.appointmentDates.findMany({
          where: {
            appointmentId:
              appointmentBillingTransaction?.billing?.appointment?.id,
          },
        }),
      ]);

    const sortDateByTime = appointmentDates?.sort(function (x, y) {
      return new Date(x?.date).getTime() - new Date(y?.date).getTime();
    });

    return {
      message: 'Appointment Billing Transaction',
      data: {
        ...appointmentBillingTransaction,
        appointmentProposal: appointmentProposal[0],
        startDate: sortDateByTime[0],
        endDate: sortDateByTime[sortDateByTime?.length - 1],
      },
    };
  }

  async changeLockedStatusByAdmin(
    userId: bigint,
    billingTransactionId: bigint,
    body: PaymentDispatcherBlockedDto,
  ) {
    const { lockedReason } = body;
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    const appointmentBillingTransaction =
      await this.prisma.appointmentBillingTransactions.findUnique({
        where: {
          id: billingTransactionId,
        },
      });

    throwBadRequestErrorCheck(!appointmentBillingTransaction, 'No Data Found');

    let transaction: AppointmentBillingTransactions;
    if (!!appointmentBillingTransaction.lockedAt) {
      transaction = await this.prisma.appointmentBillingTransactions.update({
        where: {
          id: billingTransactionId,
        },
        data: {
          lockedAt: null,
        },
      });
      return {
        message: 'Transaction unlocked successfully',
        data: { ...transaction },
      };
    } else {
      transaction = await this.prisma.appointmentBillingTransactions.update({
        where: {
          id: billingTransactionId,
        },
        data: {
          lockedAt: new Date(),
          lockedReason: lockedReason,
        },
      });
      return {
        message: 'Transaction locked successfully',
        data: { ...transaction },
      };
    }
  }

  async getAllAppointmentBillingTransactionsBySearch(
    userId: bigint,
    searchString: string,
    query: PaginationQueryParamsDto,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    let { page, limit, sortBy, sortOrder } = query;
    const orderbyObj = {};

    if (!page || page < 1) page = 1;
    if (!limit) limit = 20;
    if (!sortOrder && sortOrder != 'asc' && sortOrder != 'desc')
      sortOrder = 'desc';
    if (!sortBy) sortBy = 'createdAt';

    orderbyObj[sortBy] = sortOrder;

    const billingId = isStringNumeric(searchString)
      ? {
          equals: BigInt(searchString),
        }
      : {};

    let releaseDate: object;

    if (isStringDate(searchString) && !isStringNumeric(searchString)) {
      const startDate = new Date(searchString);
      // seconds * minutes * hours * milliseconds = 1 day
      const day = 60 * 60 * 24 * 1000;
      const endDate = new Date(startDate.getTime() + day);
      releaseDate = {
        AND: [
          {
            releaseDate: {
              gte: startDate,
            },
          },
          {
            releaseDate: {
              lte: endDate,
            },
          },
        ],
      };
    } else {
      releaseDate = {};
    }

    const [appointmentBillingTransactionCount, appointmentBillingTransaction] =
      await this.prisma.$transaction([
        this.prisma.appointmentBillingTransactions.count({
          where: {
            OR: [
              {
                billingId,
              },
              {
                state: { contains: searchString, mode: 'insensitive' },
              },
              {
                ...releaseDate,
              },
            ],
          },
        }),
        this.prisma.appointmentBillingTransactions.findMany({
          where: {
            OR: [
              {
                billingId,
              },
              {
                state: { contains: searchString, mode: 'insensitive' },
              },
              {
                ...releaseDate,
              },
            ],
          },
          include: {
            provider: {
              include: {
                user: {
                  select: {
                    id: true,
                    opk: true,
                    email: true,
                    emailVerified: true,
                    firstName: true,
                    lastName: true,
                    zipcode: true,
                    image: true,
                    loginProvider: true,
                    timezone: true,
                    facebook: true,
                    google: true,
                    meta: true,
                    createdAt: true,
                    updatedAt: true,
                    deletedAt: true,
                  },
                },
              },
            },
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: orderbyObj,
        }),
      ]);

    throwBadRequestErrorCheck(!appointmentBillingTransaction, 'No Data Found');
    return {
      message: 'Appointment Billing Transactions',
      data: { billingTransactions: appointmentBillingTransaction },
      meta: {
        total: appointmentBillingTransactionCount,
        currentPage: page,
        limit,
      },
    };
  }
}
