import { Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { customAlphabet } from 'nanoid';
import { throwNotFoundErrorCheck } from 'src/utils';

@Injectable()
export class ProviderServicesService {
  constructor(
    private prismaService: PrismaService,
    private commonService: CommonService,
  ) {}

  async generateProviderServiceSlug(slug: string) {
    let tempSlug = slug;
    let generatedSlug = true;
    while (generatedSlug) {
      const providerService =
        await this.prismaService.providerServices.findFirst({
          where: {
            slug: tempSlug,
          },
        });
      if (!providerService) {
        generatedSlug = false;
      } else {
        const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 4);

        tempSlug = this.commonService.getSlug(slug + ' ' + nanoid());
      }
    }
    return tempSlug;
  }

  async create(userId: bigint, serviceTypeId: number) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    const serviceType = await this.prismaService.serviceType.findFirst({
      where: { id: serviceTypeId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!serviceType, 'Service type not found');

    if (user?.provider) {
      const providerService =
        await this.prismaService.providerServices.findFirst({
          where: {
            providerId: user.provider.id,
            serviceTypeId: +serviceTypeId,
            deletedAt: null,
          },
        });

      throwBadRequestErrorCheck(
        !!providerService,
        'Provider service already exists',
      );

      const slug = await this.generateProviderServiceSlug(
        `${user.provider.slug}-${serviceType.slug}`,
      );

      const providerServices = await this.prismaService.providerServices.create(
        {
          data: {
            providerId: BigInt(user.provider.id),
            serviceTypeId: +serviceTypeId,
            slug,
          },
        },
      );
      return {
        message: 'Provider service created successfully',
        data: providerServices,
      };
    } else {
      let slug = this.commonService.getSlug(
        user?.firstName + ' ' + user?.lastName,
      );
      let generatedSlug = true;
      while (generatedSlug) {
        const provider = await this.prismaService.provider.findFirst({
          where: {
            slug,
            deletedAt: null,
          },
        });
        if (!provider) {
          generatedSlug = false;
        } else {
          const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 4);
          slug = this.commonService.getSlug(
            user?.firstName + ' ' + user?.lastName + ' ' + nanoid,
          );
        }
      }

      const provider = await this.prismaService.provider.create({
        data: {
          userId: user.id,
          slug,
        },
      });

      throwBadRequestErrorCheck(!provider, 'Provider can not be created');

      const tempSlug = await this.generateProviderServiceSlug(
        `${provider.slug}-${serviceType.slug}`,
      );

      const providerServices = await this.prismaService.providerServices.create(
        {
          data: {
            providerId: provider?.id,
            serviceTypeId,
            slug: tempSlug,
          },
        },
      );
      return {
        message: 'Provider service created successfully',
        data: providerServices,
      };
    }
  }

  async findAll(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user?.provider, 'User is not a provider');

    const providerServices = await this.prismaService.providerServices.findMany(
      {
        where: {
          providerId: user.provider.id,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    );

    throwNotFoundErrorCheck(
      !providerServices.length,
      'Provider service list not found',
    );

    return {
      message: 'Provider services found successfully',
      data: providerServices,
    };
  }
}
