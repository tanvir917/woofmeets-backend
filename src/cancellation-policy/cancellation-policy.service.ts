import { Injectable } from '@nestjs/common';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CancellationPolicyService {
  constructor(private prismaService: PrismaService) {}

  async createOrUpdate(userId: bigint, policyId: number) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { provider: true },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    const providerUpdate = await this.prismaService.provider.update({
      where: { id: user?.provider.id },
      data: {
        cancellationPolicyId: policyId,
      },
      include: {
        cancellationPolicy: true,
      },
    });

    throwBadRequestErrorCheck(
      !providerUpdate,
      'Provider policy can not be created or updated!',
    );

    return {
      message: 'Provider policy created or updated successfully!',
      data: providerUpdate,
    };
  }

  async findAll() {
    const policies = await this.prismaService.cancellationPolicy.findMany({
      where: { deletedAt: null },
      orderBy: { sequence: 'asc' },
    });

    throwBadRequestErrorCheck(!policies, 'No policies found');

    return {
      message: 'Policies found',
      data: policies,
    };
  }

  async findProviderPolicy(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        provider: {
          select: {
            id: true,
            cancellationPolicy: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user.provider, 'User is not a provider');

    throwBadRequestErrorCheck(
      !user.provider.cancellationPolicy,
      'No policy found',
    );

    return {
      message: 'Provider cancellation policy found',
      data: user.provider?.cancellationPolicy,
    };
  }
}
