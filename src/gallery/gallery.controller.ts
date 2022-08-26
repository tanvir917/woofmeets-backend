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
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { GalleryPhotoUpdateBodyDto } from './dto/update.photo.dto';
import { GalleryPhotoUploadBodyDto } from './dto/upload.photo.dto';
import { GalleryService } from './gallery.service';

@ApiTags('Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/photo/get-all')
  async getAllPhoto(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.galleryService.getAllPhoto(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/photo/get/:id')
  async getPhoto(@Param('id') id: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !id || id == undefined,
      'Invalid photo id. Please, try again after sometime with valid photo id.',
    );
    return await this.galleryService.getPhoto(userId, BigInt(id));
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/photo/upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('file', 1))
  async uploadPhoto(
    @UploadedFiles() file: Express.Multer.File,
    @Body() body: GalleryPhotoUploadBodyDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.galleryService.uploadPhoto(userId, file);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/photo/update/:id')
  async updatePhoto(
    @Param('id') id: string,
    @Request() req: any,
    @Body() galleryPhotoUpdateBodyDto: GalleryPhotoUpdateBodyDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !id || id == undefined,
      'Invalid photo id. Please, try again after sometime with valid photo id.',
    );
    return await this.galleryService.updatePhoto(
      userId,
      BigInt(id),
      galleryPhotoUpdateBodyDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('/photo/delete/:id')
  async deletePhoto(@Param('id') id: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !id || id == undefined,
      'Invalid photo id. Please, try again after sometime with valid photo id.',
    );
    return await this.galleryService.deletePhoto(userId, BigInt(id));
  }
}
