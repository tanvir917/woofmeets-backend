import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { FileModule } from 'src/file/file.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { PetController } from './pet.controller';
import { PetService } from './pet.service';

@Module({
  imports: [PrismaModule, CommonModule, FileModule, SecretModule],
  controllers: [PetController],
  providers: [PetService],
})
export class PetModule {}
