import { ConflictException, Injectable } from '@nestjs/common';
import {
  throwBadRequestErrorCheck,
  throwConflictErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { CreateServiceRateDto } from './dto/create-service-rate.dto';
import { CreateServiceTypeRateDto } from './dto/create-type-rate.dto';

@Injectable()
export class ServiceTypeHasRatesService {
  constructor(
    private readonly secretService: SecretService,
    private readonly prismaService: PrismaService,
  ) {}

  async create(body: CreateServiceTypeRateDto) {
    const exists = await this.prismaService.serviceTypeHasRates.findFirst({
      where: {
        serviceTypeId: body.serviceTypeId,
        serviceRateTypeId: body.rateTypeId,
        deletedAt: null,
      },
    });

    if (exists) {
      throw new ConflictException('This service type already own this rate.');
    }

    const rate = await this.prismaService.serviceTypeHasRates.create({
      data: {
        serviceTypeId: body.serviceTypeId,
        serviceRateTypeId: body.rateTypeId,
      },
      include: {
        ServiceType: true,
        serviceRateType: true,
      },
    });

    throwBadRequestErrorCheck(!rate, 'Service type rate create unsuccessfull.');

    return {
      message: 'Service type rate added successfully.',
      data: rate,
    };
  }

  async findOne(id: number) {
    const rates = await this.prismaService.serviceTypeHasRates.findMany({
      where: {
        serviceTypeId: id,
        deletedAt: null,
      },
      include: {
        ServiceType: true,
        serviceRateType: true,
      },
    });
    console.log(rates.length);

    throwNotFoundErrorCheck(
      rates.length === 0,
      'No rates found for the specific service type.',
    );

    return {
      message: 'Service type rate found succssfully.',
      data: rates,
    };
  }

  async remove(id: number) {
    const exist = await this.prismaService.serviceTypeHasRates.findFirst({
      where: {
        id: BigInt(id),
        deletedAt: null,
      },
    });

    throwNotFoundErrorCheck(
      !exist,
      'No rates found for the specific service type.',
    );

    const rate = await this.prismaService.serviceTypeHasRates.update({
      where: {
        id: BigInt(id),
      },
      data: {
        deletedAt: new Date().toISOString(),
      },
      include: {
        ServiceType: true,
      },
    });

    return {
      data: rate,
      message: 'Service type rate deleted.',
    };
  }
}
