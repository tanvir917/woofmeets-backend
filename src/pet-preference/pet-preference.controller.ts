import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransformInterceptor } from 'src/transform.interceptor';
import { CreateOrUpdatePetPreferenceDto } from './dto/create-update-pet-preference.dto';
import { PetPreferenceService } from './pet-preference.service';

@ApiTags('Pet Preference')
@Controller('pet-preference')
@UseInterceptors(TransformInterceptor)
export class PetPreferenceController {
  constructor(private readonly petPreferenceService: PetPreferenceService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get()
  findPetPreferences(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.petPreferenceService.getPetPreference(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put()
  createOrUpdatePetPreferences(
    @Body() createOrUpdatePetPreference: CreateOrUpdatePetPreferenceDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.petPreferenceService.createOrUpdate(
      userId,
      createOrUpdatePetPreference,
    );
  }
}
