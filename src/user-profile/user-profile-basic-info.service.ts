import { Injectable } from '@nestjs/common';
import { FileService } from 'src/file/file.service';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { CreateBasicInfoDto } from './dto/create-user-basic-info.dto';
import { UpdateBasicInfoDto } from './dto/update-user-basic-info';

@Injectable()
export class UserProfileBasicInfoService {
  constructor(
    private prismaService: PrismaService,
    private fileService: FileService,
    private secretService: SecretService,
  ) {}

  async createBasicInfo(
    userId: bigint,
    createBasicInfoDto: CreateBasicInfoDto,
  ) {
    const {
      dob,
      addressLine1,
      addressLine2,
      street,
      city,
      state,
      countryId,
      zipCode,
      latitude,
      longitude,
      meta,
    } = createBasicInfoDto;

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        basicInfo: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(
      !!user?.basicInfo,
      'User already has basic info. Plese update instead',
    );

    const country = await this.prismaService.country.findFirst({
      where: { id: countryId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!country, 'Country not found');

    const basicInfo = await this.prismaService.basicInfo.upsert({
      where: { userId: userId },
      update: {
        dob,
        addressLine1,
        addressLine2,
        street,
        city,
        state,
        countryId: country?.id,
        zipCode,
        latitude,
        longitude,
        detailsSubmitted: true,
        meta: Object(meta),
      },
      create: {
        userId: userId,
        dob,
        addressLine1,
        addressLine2,
        street,
        city,
        state,
        countryId: country?.id,
        zipCode,
        latitude,
        longitude,
        detailsSubmitted: true,
        meta: Object(meta),
      },
    });

    throwBadRequestErrorCheck(!basicInfo, 'Basic info can not be created');

    return {
      message: 'Basic info created',
      data: basicInfo,
    };
  }

  findAll() {
    return `This action returns all userProfile`;
  }

  async getBasicInfo(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        basicInfo: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user?.basicInfo, 'User has no basic info');

    return {
      message: 'Basic info found',
      data: user?.basicInfo,
    };
  }

  async updateBasicInfo(
    userId: bigint,
    updateBasicInfoDto: UpdateBasicInfoDto,
  ) {
    const {
      dob,
      addressLine1,
      addressLine2,
      street,
      city,
      state,
      countryId,
      zipCode,
      latitude,
      longitude,
      meta,
    } = updateBasicInfoDto;

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        basicInfo: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(!user?.basicInfo, 'User has no basic info');

    const basicInfo = await this.prismaService.basicInfo.update({
      where: { id: user?.basicInfo?.id },
      data: {
        dob,
        addressLine1,
        addressLine2,
        street,
        city,
        state,
        countryId,
        zipCode,
        latitude,
        longitude,
        meta: Object(meta),
        detailsSubmitted: true,
      },
    });

    throwBadRequestErrorCheck(!basicInfo, 'Basic info can not be updated');

    return {
      message: 'Basic info updated',
      data: basicInfo,
    };
  }

  async uploadProfilePicture(userId: bigint, file: Express.Multer.File) {
    throwBadRequestErrorCheck(!file[0], 'No file uploaded');

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    const mappedFile = this.fileService.mapFileToType({
      buffer: file[0].buffer,
      encoding: file[0].encoding,
      originalname: file[0].originalname,
      mimetype: file[0].mimetype,
      fieldname: 'users' ?? this.secretService.getAwsCreds().awsUploadPath,
      size: file[0].size + '',
    });

    const uploadedFile = await this.fileService.uploadToS3(mappedFile);

    throwBadRequestErrorCheck(!uploadedFile, 'File can not be uploaded');

    const updatedUser = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        image: {
          url: uploadedFile.Location,
          type: uploadedFile.MimeType,
          key: uploadedFile.key,
          Key: uploadedFile.Key,
        },
      },
    });

    throwBadRequestErrorCheck(!updatedUser, 'Could not update profile picture');

    const userUpdated = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        image: true,
      },
    });

    return {
      message: 'Profile picture updated',
      data: userUpdated,
    };
  }
}
