import { Module } from '@nestjs/common';
import { PetPreferenceService } from './pet-preference.service';
import { PetPreferenceController } from './pet-preference.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PetPreferenceController],
  providers: [PetPreferenceService],
})
export class PetPreferenceModule {}
