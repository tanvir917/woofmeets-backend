import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'src/prisma/prisma.service';
import { PetService } from './pet.service';

@ApiTags('Pet')
@Controller('pet')
export class PetController {
  constructor(
    private readonly petService: PetService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('/breeds')
  async getDogBreeds() {
    return await this.petService.getAllBreeds();
  }
}
