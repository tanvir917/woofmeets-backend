import { Injectable } from '@nestjs/common';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { GetBalancesQueryDto } from './dto/get-balances-query.dto';
import { BalanceStatus } from './entities/balance.entity';

@Injectable()
export class BalancesService {
  constructor(private readonly prismaService: PrismaService) {}

  async findPetOwnerPaymentHistory(userId: bigint, query: GetBalancesQueryDto) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    let { page, limit, sortBy, sortOrder } = query;
    const { status } = query;
    const orderbyObj = {};

    const statusQuery = BalanceStatus[status]
      ? { status: BalanceStatus[status] }
      : {};
    if (!page || page < 1) page = 1;
    if (!limit) limit = 20;
    if (!sortOrder && sortOrder != 'asc' && sortOrder != 'desc')
      sortOrder = 'desc';
    if (!sortBy) sortBy = 'createdAt';

    orderbyObj[sortBy] = sortOrder;

    const [count, paymentHistory] = await this.prismaService.$transaction([
      this.prismaService.appointmentBillingPayments.count({
        where: {
          paidByUserId: userId,
          ...statusQuery,
        },
      }),

      this.prismaService.appointmentBillingPayments.findMany({
        where: {
          paidByUserId: userId,
          ...statusQuery,
        },
        include: {
          billing: {
            include: {
              appointment: {
                include: {
                  appointmentPet: true,
                  provider: {
                    select: {
                      id: true,
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                          email: true,
                          image: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: orderbyObj,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    throwBadRequestErrorCheck(count === 0, 'No payment history found');

    return {
      message: 'Payment history found',
      data: paymentHistory,
      meta: {
        total: count,
        currentPage: page,
        limit,
      },
    };
  }
}
