import { Injectable } from '@nestjs/common';
import { throwNotFoundErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';

@Injectable()
export class ServiceTypesService {
  constructor(
    private readonly secretService: SecretService,
    private readonly prismaService: PrismaService,
  ) {}
  async findAll() {
    const serviceTypes = await this.prismaService.serviceType.findMany({
      where: {
        deletedAt: null,
        active: true,
        browsable: true,
      },
      orderBy: {
        sequence: 'asc',
      },
    });

    throwNotFoundErrorCheck(!serviceTypes, 'No service types found');

    return { message: 'Service types found!', data: serviceTypes };
  }
}
