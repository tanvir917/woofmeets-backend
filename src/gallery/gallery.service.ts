import { Injectable } from '@nestjs/common';
import { FileService } from 'src/file/file.service';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { GalleryPhotosDragDropDto } from './dto/draganddrop.photo.dto';
import { GalleryPhotoUpdateDto } from './dto/update.photo.dto';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly secretService: SecretService,
    private readonly fileService: FileService,
  ) {}

  async getAllPhoto(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const photos = await this.prismaService.gallery.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [{ sequence: 'asc' }],
    });

    throwBadRequestErrorCheck(
      !photos || photos?.length <= 0,
      'Photos not found.',
    );

    return {
      message: 'Photos found successfully.',
      data: photos,
    };
  }

  async getPhoto(userId: bigint, id: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const photo = await this.prismaService.gallery.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!photo, 'Photo not found.');

    return {
      message: 'Photo found successfully.',
      data: photo,
    };
  }

  async uploadPhoto(userId: bigint, file: Express.Multer.File) {
    throwBadRequestErrorCheck(!file[0], 'No file uploaded.');

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const mappedFile = this.fileService.mapFileToType({
      buffer: file[0].buffer,
      encoding: file[0].encoding,
      originalname: file[0].originalname,
      mimetype: file[0].mimetype,
      fieldname: 'gallery' ?? this.secretService.getAwsCreds().awsUploadPath,
      size: file[0].size + '',
    });

    const uploadedFile = await this.fileService.uploadToS3(mappedFile);

    throwBadRequestErrorCheck(!uploadedFile, 'File can not be uploaded.');

    const photoCount = await this.prismaService.gallery.aggregate({
      where: {
        userId,
      },
      _count: {
        id: true,
      },
    });

    const photo = await this.prismaService.gallery.create({
      data: {
        userId,
        imageSrc: {
          url: uploadedFile?.Location,
          type: uploadedFile?.MimeType,
          key: uploadedFile?.key,
          Key: uploadedFile?.Key,
        },
        sequence: photoCount?._count?.id + 1,
      },
    });

    throwBadRequestErrorCheck(!photo, 'Could not upload photo in gallery.');

    return {
      message: 'Photo uploaded successfully.',
      data: photo,
    };
  }

  async updatePhoto(
    userId: bigint,
    id: bigint,
    photoInfo: GalleryPhotoUpdateDto,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    let photo = await this.prismaService.gallery.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!photo, 'Photo not found.');

    const { caption } = photoInfo;

    photo = await this.prismaService.gallery.update({
      where: {
        id,
      },
      data: {
        userId,
        caption: caption ?? null,
      },
    });

    throwBadRequestErrorCheck(!photo, 'Could not update photo in gallery.');

    return {
      message: 'Photo updated successfully.',
      data: photo,
    };
  }

  async dragAndDropPhotos(
    userId: bigint,
    galleryPhotosDragDropDto: GalleryPhotosDragDropDto,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    let { photos } = galleryPhotosDragDropDto;

    const promises = [];

    for (let i = 0; i < photos?.length; i++) {
      promises.push(
        await this.prismaService.gallery.update({
          where: {
            id: photos[i]?.id,
          },
          data: {
            sequence: i + 1,
          },
        }),
      );
    }

    await Promise.allSettled(promises);
    photos = await this.getAllPhoto(userId);

    throwBadRequestErrorCheck(!photos?.data, 'Could not drag and drop photos.');

    return photos;
  }

  async deletePhoto(userId: bigint, id: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    let photo = await this.prismaService.gallery.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!photo, 'Photo not found.');

    photo = await this.prismaService.gallery.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    throwBadRequestErrorCheck(!photo, 'Photo can not deleted now.');

    return {
      message: 'Photo deleted successfully.',
      data: photo,
    };
  }
}
