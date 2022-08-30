import { Injectable } from '@nestjs/common';
import { throwNotFoundErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { PetTypeEnum } from 'src/utils/enums';

@Injectable()
export class PetService {
  constructor(private prismaService: PrismaService) {}
  async getAllBreeds() {
    const [dogBreeds, catBreeds] = await this.prismaService.$transaction([
      this.prismaService.breeds.findMany({
        where: {
          petType: PetTypeEnum.DOG,
          visible: true,
          deletedAt: null,
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          petType: true,
          sequence: true,
        },
      }),
      this.prismaService.breeds.findMany({
        where: {
          petType: PetTypeEnum.CAT,
          visible: true,
          deletedAt: null,
        },
        orderBy: {
          name: 'asc',
        },
        select: {
          id: true,
          name: true,
          petType: true,
          sequence: true,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!dogBreeds && !catBreeds, 'Breeds not found.');

    return {
      message: 'Breeds found successfully.',
      data: {
        dogBreeds,
        catBreeds,
      },
    };
  }
}
