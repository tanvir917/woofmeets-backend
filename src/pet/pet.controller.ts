import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { GalleryPhotosDragDropDto } from 'src/gallery/dto/draganddrop.photo.dto';
import { GalleryPhotoUpdateDto } from 'src/gallery/dto/update.photo.dto';
import { GalleryPhotoUploadDto } from 'src/gallery/dto/upload.photo.dto';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { TransformInterceptor } from 'src/transform.interceptor';
import { CreatePetDto } from './dto/create.pet.dto';
import { UpdatePetDto } from './dto/update.pet.dto';
import { PetService } from './pet.service';

@ApiTags('Pet')
@Controller('pet')
@UseInterceptors(TransformInterceptor)
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get('/breeds')
  async getDogBreeds() {
    return await this.petService.getAllBreeds();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/get-all')
  async getAllPet(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.petService.getAllPet(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/get/:opk')
  async getPet(@Param('opk') opk: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid pet opk. Please, try again after sometime with valid pet opk.',
    );
    return await this.petService.getPet(userId, opk);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profile_image', maxCount: 1 },
      { name: 'gallery', maxCount: 15 },
    ]),
  )
  @Post('/create')
  async createPet(
    @Body() createPetDto: CreatePetDto,
    @Request() req: any,
    @UploadedFiles()
    files: {
      profile_image?: Express.Multer.File;
      gallery?: Express.Multer.File[];
    },
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.petService.createPet(
      userId,
      createPetDto,
      files?.profile_image,
      files?.gallery,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('profile_image', 1))
  @Put('/update/:opk')
  async updatePet(
    @Param('opk') opk: string,
    @UploadedFiles() profile_image: Express.Multer.File,
    @Body() updatePetDto: UpdatePetDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);

    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid pet opk. Please, try again after sometime with valid pet opk.',
    );
    return await this.petService.updatePet(
      userId,
      opk,
      profile_image,
      updatePetDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:opk')
  async deletePet(@Param('opk') opk: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);

    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid pet opk. Please, try again after sometime with valid pet opk.',
    );
    return await this.petService.deletePet(userId, opk);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/photo/get-all/:opk')
  async getAllPhoto(@Request() req: any, @Param('opk') opk: string) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid pet opk. Please, try again after sometime with valid pet opk.',
    );
    return await this.petService.getAllPhoto(userId, opk);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/photo/upload/:opk')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('file', 1))
  async uploadPhoto(
    @Param('opk') opk: string,
    @UploadedFiles() file: Express.Multer.File,
    @Body() body: GalleryPhotoUploadDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid pet opk. Please, try again after sometime with valid pet opk.',
    );
    return await this.petService.uploadPhoto(userId, opk, file);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/photo/update/:opk/:id')
  async updatePhoto(
    @Param('opk') opk: string,
    @Param('id') id: string,
    @Request() req: any,
    @Body() galleryPhotoUpdateDto: GalleryPhotoUpdateDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !id || id == undefined,
      'Invalid photo id. Please, try again after sometime with valid photo id.',
    );

    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid pet opk. Please, try again after sometime with valid pet opk.',
    );

    return await this.petService.updatePhoto(
      userId,
      BigInt(id),
      opk,
      galleryPhotoUpdateDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/photo/drag-drops/:opk')
  async dragAndDropPhotos(
    @Param('opk') opk: string,
    @Request() req: any,
    @Body() galleryPhotoDragDropsDto: GalleryPhotosDragDropDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);

    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid pet opk. Please, try again after sometime with valid pet opk.',
    );

    return await this.petService.dragAndDropPhotos(
      userId,
      opk,
      galleryPhotoDragDropsDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('/photo/delete/:opk/:id')
  async deletePhoto(
    @Param('opk') opk: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !id || id == undefined,
      'Invalid photo id. Please, try again after sometime with valid photo id.',
    );

    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid pet opk. Please, try again after sometime with valid pet opk.',
    );
    return await this.petService.deletePhoto(userId, opk, BigInt(id));
  }
}
