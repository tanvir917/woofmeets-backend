import { ConflictException, Injectable } from '@nestjs/common';
import {
  throwForbiddenErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(userId: bigint, body: CreateAvailabilityDto) {
    const existance = await this.prismaService.availableDay.findFirst({
      where: {
        providerServiceId: body.providerServiceId,
        deletedAt: null,
      },
    });

    if (existance) {
      throw new ConflictException(
        'Available day already created for the specific provider service. ',
      );
    }
    const { pottyBreak, fulltime, ...restBody } = body;

    const service = await this.prismaService.providerServices.findFirst({
      where: {
        id: body.providerServiceId,
        deletedAt: null,
      },
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(
      !service,
      'Provider service not found with the specific id',
    );

    // cross check with userid with existing service.
    throwForbiddenErrorCheck(
      userId !== service.provider.userId,
      "Service doesn't belong to the specific user.",
    );

    await this.prismaService.providerServices.update({
      where: {
        id: service.id,
      },
      data: {
        pottyBreak,
        fulltime,
      },
    });

    const days = await this.prismaService.availableDay.create({
      data: {
        ...restBody,
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    return {
      message: 'Available day create succussfully.',
      data: days,
    };
  }

  async findOne(id: bigint) {
    const days = await this.prismaService.availableDay.findFirst({
      where: {
        providerServiceId: id,
        deletedAt: null,
      },
      include: {
        service: {
          include: {
            serviceType: true,
            provider: true,
          },
        },
      },
    });
    throwNotFoundErrorCheck(!days, 'Availabile day not found.');
    return {
      message: 'Available day found successfully.',
      data: days,
    };
  }

  async findDaysForAllServices(userId: bigint) {
    const services = await this.prismaService.providerServices.findMany({
      where: {
        provider: {
          userId,
        },
        deletedAt: null,
      },
    });
    const serviceId = [];
    services.map((service) => serviceId.push(service.id));

    const days = await this.prismaService.availableDay.findMany({
      where: {
        providerServiceId: {
          in: serviceId,
        },
        deletedAt: null,
      },
      include: {
        service: {
          include: {
            serviceType: true,
            provider: true,
          },
        },
      },
    });

    return {
      message: 'Available day found successfully.',
      data: days,
    };
  }

  async update(id: bigint, userId: bigint, body: UpdateAvailabilityDto) {
    const existingDays = await this.prismaService.availableDay.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });
    throwNotFoundErrorCheck(!existingDays, 'Availabile day not found.');
    throwForbiddenErrorCheck(
      userId !== existingDays.service?.provider?.userId,
      "Service doesn't belong to the specific user.",
    );

    const { pottyBreak, fulltime, ...restBody } = body;

    await this.prismaService.providerServices.update({
      where: {
        id: existingDays?.service?.id,
      },
      data: {
        pottyBreak,
        fulltime,
      },
    });

    const days = await this.prismaService.availableDay.update({
      where: {
        id,
      },
      data: {
        providerServiceId: existingDays.providerServiceId,
        ...restBody,
      },
      include: {
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    return {
      message: 'Available day updated succussfully.',
      data: days,
    };
  }

  async getAllAvailableServices(userId: bigint) {
    return {
      message: 'All available services',
      userId,
    };
  }
}
