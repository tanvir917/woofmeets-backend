import { BadRequestException, Injectable } from '@nestjs/common';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { CreateMultipleServiceRateDto } from './dto/create-multiple-service-rate.dto';
import { CreateServiceRateDto } from './dto/create-service-rate.dto';
import { UpdateServiceRateDto } from './dto/update-service-rate.dto';

@Injectable()
export class ServiceRatesService {
  constructor(
    private readonly secretService: SecretService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(body: CreateServiceRateDto) {
    const existingSameRate = await this.prismaService.serviceHasRates.findFirst(
      {
        where: {
          providerServicesId: body.serviceId,
          serviceTypeHasRatesId: body.rateId,
          deletedAt: null,
        },
      },
    );

    if (existingSameRate) {
      throw new BadRequestException(
        'Amount found for the specific service and rate id.',
      );
    }

    const rate = await this.prismaService.serviceHasRates.create({
      data: {
        providerServicesId: body.serviceId,
        serviceTypeHasRatesId: body.rateId,
        amount: body.amount,
      },
    });

    throwBadRequestErrorCheck(!rate, 'Amount could not be created.');

    return {
      message: 'Amount create succussfully for service.',
      data: rate,
    };
  }

  async multipleCreate(body: CreateMultipleServiceRateDto) {
    const { serviceRate } = body;

    const promises = [];

    for (let i = 0; i < serviceRate?.length; i++) {
      promises.push(await this.create(serviceRate[i]));
    }

    await Promise.allSettled(promises);

    return {
      message: 'Multiple amount create succussfully for service.',
    };
  }

  async update(id: bigint, body: UpdateServiceRateDto) {
    const existingSameRate = await this.prismaService.serviceHasRates.findFirst(
      {
        where: {
          id,
          deletedAt: null,
        },
      },
    );

    if (!existingSameRate) {
      throw new BadRequestException(
        'Amount not found for the specific service and rate id.',
      );
    }

    const rate = await this.prismaService.serviceHasRates.update({
      where: {
        id,
      },
      data: {
        amount: body.amount,
      },
    });

    throwBadRequestErrorCheck(!rate, 'Amount could not be updated.');

    return {
      message: 'Amount update succussfully for service.',
      data: rate,
    };
  }

  async multipleUpdate(body: CreateMultipleServiceRateDto) {
    const { serviceRate } = body;

    const promises = [];

    for (let i = 0; i < serviceRate?.length; i++) {
      promises.push(
        await this.update(BigInt(serviceRate[i]?.rateId) ?? BigInt(-1), {
          amount: serviceRate[i]?.amount,
        }),
      );
    }

    await Promise.allSettled(promises);

    return {
      message: 'Multiple amount update succussfully for service.',
    };
  }

  async findOne(id: bigint) {
    const rate = await this.prismaService.serviceHasRates.findMany({
      where: {
        providerServicesId: id,
        deletedAt: null,
      },
      include: {
        service: true,
        serviceTypeRate: {
          include: {
            serviceRateType: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (rate.length === 0) {
      throw new BadRequestException(
        'No rate has been set for the specific provider service.',
      );
    }
    return {
      data: rate,
      message: 'Service rate found successfully.',
    };
  }

  async remove(id: number) {
    const existingSameRate = await this.prismaService.serviceHasRates.findFirst(
      {
        where: {
          id,
          deletedAt: null,
        },
      },
    );

    throwNotFoundErrorCheck(!existingSameRate, 'Service rate not found.');

    const rate = await this.prismaService.serviceHasRates.update({
      where: {
        id,
      },
      data: {
        deletedAt: null,
      },
      include: {
        service: true,
        serviceTypeRate: true,
      },
    });

    return {
      data: rate,
      message: 'Service rate deleted successfully.',
    };
  }

  async getServiceRateTypes() {
    const data = await this.prismaService.serviceRateType.findMany({
      where: {
        active: true,
        deletedAt: null,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return {
      message: 'Service rate type found successfully.',
      data,
    };
  }
}
