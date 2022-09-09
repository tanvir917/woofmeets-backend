import { Injectable } from '@nestjs/common';
import { throwNotFoundErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProviderService {
  constructor(private readonly prismaService: PrismaService) {}

  async getProviderDetails(opk: string) {
    const provider = await this.prismaService.user.findFirst({
      where: {
        opk,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        image: true,
        provider: {
          include: {
            providerServices: {
              include: {
                serviceType: true,
              },
            },
          },
        },
        Gallery: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            imageSrc: true,
            sequence: true,
            caption: true,
            meta: true,
          },
        },
      },
    });

    throwNotFoundErrorCheck(!provider, 'Provider not found.');

    return {
      message: 'Provider details found successfully',
      data: provider,
    };
  }
}
