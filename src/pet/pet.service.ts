import { Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { FileService } from 'src/file/file.service';
import { MulterFileUploadService } from 'src/file/multer-file-upload-service';
import { GalleryPhotosDragDropDto } from 'src/gallery/dto/draganddrop.photo.dto';
import { GalleryPhotoUpdateDto } from 'src/gallery/dto/update.photo.dto';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { FriendlyTypeEnum, PetTypeEnum } from 'src/utils/enums';
import { CreatePetDto } from './dto/create.pet.dto';
import { UpdatePetDto } from './dto/update.pet.dto';

@Injectable()
export class PetService {
  constructor(
    private prismaService: PrismaService,
    private commonService: CommonService,
    private secretService: SecretService,
    private fileService: FileService,
    private multerFileUploadService: MulterFileUploadService,
  ) {}
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

  async getAllPet(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const pets = await this.prismaService.pet.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        opk: true,
        type: true,
        weight: true,
        gender: true,
        ageMonth: true,
        ageYear: true,
        profile_image: true,
      },
    });

    throwBadRequestErrorCheck(!pets || pets?.length <= 0, 'Pet not found.');

    return {
      message: 'Pets found successfully.',
      data: pets,
    };
  }

  async getPet(userId: bigint, opk: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const pet = await this.prismaService.pet.findFirst({
      where: {
        opk,
        userId,
        deletedAt: null,
      },
      include: {
        petBreed: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            petId: true,
            breedId: true,
            breed: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        petGallery: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            petId: true,
            imageSrc: true,
            caption: true,
            profileImage: true,
            responsive: true,
            public: true,
          },
          orderBy: [{ sequence: 'asc' }],
        },
      },
    });

    throwBadRequestErrorCheck(!pet, 'Pet not found.');

    return {
      message: 'Pet found successfully.',
      data: {
        ...pet,
        pill: pet?.pillMedication ? true : false,
        topical: pet?.topicalMedication ? true : false,
        injection: pet?.injectionMedication ? true : false,
      },
    };
  }

  async createPet(
    userId: bigint,
    createPetDto: CreatePetDto,
    profile_image: Express.Multer.File[],
    gallery: Express.Multer.File[],
  ) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    let opk = this.commonService.getOpk();
    let opkGenerated = false;
    while (!opkGenerated) {
      const checkOpk = await this.prismaService.user.findFirst({
        where: {
          opk,
          deletedAt: null,
        },
      });
      if (checkOpk) {
        opk = this.commonService.getOpk();
      } else {
        opkGenerated = true;
      }
    }

    let uploadedFile: any;

    if (profile_image?.length > 0) {
      const mappedFile = this.fileService.mapFileToType({
        buffer: profile_image[0].buffer,
        encoding: profile_image[0].encoding,
        originalname: profile_image[0].originalname,
        mimetype: profile_image[0].mimetype,
        fieldname:
          'pet/profile-image' ?? this.secretService.getAwsCreds().awsUploadPath,
        size: profile_image[0].size + '',
      });

      uploadedFile = await this.fileService.uploadToS3(mappedFile);

      throwBadRequestErrorCheck(
        !uploadedFile,
        'Profile image can not be uploaded.',
      );
    }

    const {
      name,
      type,
      weight,
      ageYear,
      ageMonth,
      gender,
      breeds,
      microchipped,
      spayedOrNeutered,
      houseTrained,
      houseTrainedAdditionalDetails,
      childFriendly,
      childFrinedlyAdditionalDetails,
      dogFriendly,
      dogFrinedlyAdditionalDetails,
      catFriendly,
      catFrinedlyAdditionalDetails,
      about,
      energyLevel,
      feedingSchedule,
      feedingScheduleDetails,
      pottyBreakSchedule,
      pottyBreakScheduleDetails,
      canLeftAlone,
      canLeftAloneDetails,
      pillMedication,
      topicalMedication,
      injectionMedication,
      sitterInstructions,
      vetInfo,
    } = createPetDto;

    const pet = await this.prismaService.pet.create({
      data: {
        userId,
        name,
        opk,
        type,
        weight,
        ageYear,
        ageMonth,
        gender,
        profile_image: uploadedFile
          ? {
              url: uploadedFile?.Location,
              type: uploadedFile?.MimeType,
              key: uploadedFile?.key,
              Key: uploadedFile?.Key,
            }
          : undefined,
        microchipped,
        spayedOrNeutered,
        houseTrained: houseTrained?.length > 0 ? houseTrained : null,
        houseTrainedAdditionalDetails:
          houseTrained == FriendlyTypeEnum.DEPENDS
            ? houseTrainedAdditionalDetails
            : null,
        childFriendly: childFriendly?.length > 0 ? childFriendly : null,
        childFrinedlyAdditionalDetails:
          childFriendly == FriendlyTypeEnum.DEPENDS
            ? childFrinedlyAdditionalDetails
            : null,
        dogFriendly: dogFriendly?.length > 0 ? dogFriendly : null,
        dogFrinedlyAdditionalDetails:
          dogFriendly == FriendlyTypeEnum.DEPENDS
            ? dogFrinedlyAdditionalDetails
            : null,
        catFriendly: catFriendly?.length > 0 ? catFriendly : null,
        catFrinedlyAdditionalDetails:
          catFriendly == FriendlyTypeEnum.DEPENDS
            ? catFrinedlyAdditionalDetails
            : null,
        about: about?.length ? about : null,
        energyLevel: energyLevel?.length > 0 ? energyLevel : null,
        feedingSchedule: feedingSchedule?.length ? feedingSchedule : null,
        feedingScheduleDetails:
          feedingSchedule == 'Custom' ? feedingScheduleDetails : null,
        pottyBreakSchedule: pottyBreakSchedule?.length
          ? pottyBreakSchedule
          : null,
        pottyBreakScheduleDetails:
          pottyBreakSchedule == 'Custom' ? pottyBreakScheduleDetails : null,
        canLeftAlone: canLeftAlone?.length ? canLeftAlone : null,
        canLeftAloneDetails:
          canLeftAlone == 'Custom' ? canLeftAloneDetails : null,
        pillMedication: pillMedication?.length ? pillMedication : null,
        topicalMedication: topicalMedication?.length ? topicalMedication : null,
        injectionMedication: injectionMedication?.length
          ? injectionMedication
          : null,
        sitterInstructions: sitterInstructions?.length
          ? sitterInstructions
          : null,
        vetInfo: vetInfo?.length ? vetInfo : null,
      },
    });

    throwBadRequestErrorCheck(!pet, 'Pet can not create now.');

    const breedsArray = [...JSON.parse(breeds)];

    let promises = [];

    for (let i = 0; i < breedsArray?.length; i++) {
      promises.push(
        await this.prismaService.petBreed.create({
          data: {
            petId: pet?.id,
            breedId: breedsArray[i]?.id,
          },
        }),
      );
    }

    await Promise.allSettled(promises);

    if (gallery?.length > 0) {
      const uploadedGallery = await this.multerFileUploadService.uploadMultiple(
        gallery,
        'pet/gallery',
      );

      throwBadRequestErrorCheck(
        !uploadedGallery,
        'Gallery can not be uploaded.',
      );

      promises = [];

      const photoCount = await this.prismaService.petGallery.aggregate({
        where: {
          petId: pet?.id,
        },
        _count: {
          id: true,
        },
      });

      for (let i = 0; i < uploadedGallery?.length; i++) {
        promises.push(
          await this.prismaService.petGallery.create({
            data: {
              petId: pet?.id,
              imageSrc: Object(uploadedGallery[i]),
              sequence: photoCount?._count?.id + i + 1,
            },
          }),
        );
      }
    }

    const [dbBredds, dbGallery] = await this.prismaService.$transaction([
      this.prismaService.petBreed.findMany({
        where: {
          petId: pet?.id,
          deletedAt: null,
        },
        select: {
          id: true,
          petId: true,
          breedId: true,
          breed: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prismaService.petGallery.findMany({
        where: {
          petId: pet?.id,
          deletedAt: null,
        },
        select: {
          id: true,
          petId: true,
          imageSrc: true,
          caption: true,
          sequence: true,
          profileImage: true,
          responsive: true,
          public: true,
        },
        orderBy: [{ sequence: 'asc' }],
      }),
    ]);

    return {
      message: 'Pet created successfully.',
      data: {
        ...pet,
        pill: pet?.pillMedication ? true : false,
        topical: pet?.topicalMedication ? true : false,
        injection: pet?.injectionMedication ? true : false,
        breeds: dbBredds,
        gallery: dbGallery,
      },
    };
  }

  async updatePet(
    userId: bigint,
    opk: string,
    profile_image: Express.Multer.File[],
    gallery: Express.Multer.File[],
    updatePetDto: UpdatePetDto,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    let pet = await this.prismaService.pet.findFirst({
      where: { userId, opk, deletedAt: null },
    });

    throwBadRequestErrorCheck(!pet, 'Pet not found.');

    let uploadedFile: any;
    if (profile_image?.length > 0) {
      const mappedFile = this.fileService.mapFileToType({
        buffer: profile_image[0].buffer,
        encoding: profile_image[0].encoding,
        originalname: profile_image[0].originalname,
        mimetype: profile_image[0].mimetype,
        fieldname:
          'pet/profile-image' ?? this.secretService.getAwsCreds().awsUploadPath,
        size: profile_image[0].size + '',
      });

      uploadedFile = await this.fileService.uploadToS3(mappedFile);

      throwBadRequestErrorCheck(
        !uploadedFile,
        'Profile image can not be uploaded.',
      );
    }

    const {
      name,
      type,
      weight,
      ageYear,
      ageMonth,
      gender,
      breeds,
      microchipped,
      spayedOrNeutered,
      houseTrained,
      houseTrainedAdditionalDetails,
      childFriendly,
      childFrinedlyAdditionalDetails,
      dogFriendly,
      dogFrinedlyAdditionalDetails,
      catFriendly,
      catFrinedlyAdditionalDetails,
      about,
      energyLevel,
      feedingSchedule,
      feedingScheduleDetails,
      pottyBreakSchedule,
      pottyBreakScheduleDetails,
      canLeftAlone,
      canLeftAloneDetails,
      pillMedication,
      topicalMedication,
      injectionMedication,
      sitterInstructions,
      vetInfo,
    } = updatePetDto;

    pet = await this.prismaService.pet.update({
      where: {
        id: pet?.id,
      },
      data: {
        userId,
        name,
        opk,
        type,
        weight,
        ageYear,
        ageMonth,
        gender,
        profile_image: uploadedFile
          ? {
              url: uploadedFile?.Location,
              type: uploadedFile?.MimeType,
              key: uploadedFile?.key,
              Key: uploadedFile?.Key,
            }
          : pet?.profile_image
          ? pet?.profile_image
          : undefined,
        microchipped,
        spayedOrNeutered,
        houseTrained: houseTrained?.length > 0 ? houseTrained : null,
        houseTrainedAdditionalDetails:
          houseTrained == FriendlyTypeEnum.DEPENDS
            ? houseTrainedAdditionalDetails
            : null,
        childFriendly: childFriendly?.length > 0 ? childFriendly : null,
        childFrinedlyAdditionalDetails:
          childFriendly == FriendlyTypeEnum.DEPENDS
            ? childFrinedlyAdditionalDetails
            : null,
        dogFriendly: dogFriendly?.length > 0 ? dogFriendly : null,
        dogFrinedlyAdditionalDetails:
          dogFriendly == FriendlyTypeEnum.DEPENDS
            ? dogFrinedlyAdditionalDetails
            : null,
        catFriendly: catFriendly?.length > 0 ? catFriendly : null,
        catFrinedlyAdditionalDetails:
          catFriendly == FriendlyTypeEnum.DEPENDS
            ? catFrinedlyAdditionalDetails
            : null,
        about: about?.length ? about : null,
        energyLevel: energyLevel?.length > 0 ? energyLevel : null,
        feedingSchedule: feedingSchedule?.length ? feedingSchedule : null,
        feedingScheduleDetails:
          feedingSchedule == 'Custom' ? feedingScheduleDetails : null,
        pottyBreakSchedule: pottyBreakSchedule?.length
          ? pottyBreakSchedule
          : null,
        pottyBreakScheduleDetails:
          pottyBreakSchedule == 'Custom' ? pottyBreakScheduleDetails : null,
        canLeftAlone: canLeftAlone?.length ? canLeftAlone : null,
        canLeftAloneDetails:
          canLeftAlone == 'Custom' ? canLeftAloneDetails : null,
        pillMedication: pillMedication?.length ? pillMedication : null,
        topicalMedication: topicalMedication?.length ? topicalMedication : null,
        injectionMedication: injectionMedication?.length
          ? injectionMedication
          : null,
        sitterInstructions: sitterInstructions?.length
          ? sitterInstructions
          : null,
        vetInfo: vetInfo?.length ? vetInfo : null,
      },
    });

    throwBadRequestErrorCheck(!pet, 'Pet can not update now.');

    const oldBreeds = await this.prismaService.petBreed.findMany({
      where: {
        petId: pet?.id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    const oldBreedsId = oldBreeds.map((obj) => {
      return obj?.id;
    });

    const deleteOldBreeds = await this.prismaService.petBreed.updateMany({
      where: {
        id: {
          in: oldBreedsId,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    throwBadRequestErrorCheck(
      !deleteOldBreeds,
      'Old breeds can not delete now.',
    );

    const breedsArray = [...JSON.parse(breeds)];

    let promises = [];

    for (let i = 0; i < breedsArray?.length; i++) {
      promises.push(
        await this.prismaService.petBreed.create({
          data: {
            petId: pet?.id,
            breedId: breedsArray[i]?.id,
          },
        }),
      );
    }

    await Promise.allSettled(promises);

    if (gallery?.length > 0) {
      const uploadedGallery = await this.multerFileUploadService.uploadMultiple(
        gallery,
        'pet/gallery',
      );

      throwBadRequestErrorCheck(
        !uploadedGallery,
        'Gallery can not be uploaded.',
      );

      promises = [];

      const photoCount = await this.prismaService.petGallery.aggregate({
        where: {
          petId: pet?.id,
        },
        _count: {
          id: true,
        },
      });

      for (let i = 0; i < uploadedGallery?.length; i++) {
        promises.push(
          await this.prismaService.petGallery.create({
            data: {
              petId: pet?.id,
              imageSrc: Object(uploadedGallery[i]),
              sequence: photoCount?._count?.id + i + 1,
            },
          }),
        );
      }
    }

    const [dbBredds, dbGallery] = await this.prismaService.$transaction([
      this.prismaService.petBreed.findMany({
        where: {
          petId: pet?.id,
          deletedAt: null,
        },
        select: {
          id: true,
          petId: true,
          breedId: true,
          breed: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prismaService.petGallery.findMany({
        where: {
          petId: pet?.id,
          deletedAt: null,
        },
        select: {
          id: true,
          petId: true,
          imageSrc: true,
          caption: true,
          sequence: true,
          profileImage: true,
          responsive: true,
          public: true,
        },
        orderBy: [{ sequence: 'asc' }],
      }),
    ]);

    return {
      message: 'Pet updated successfully.',
      data: {
        ...pet,
        pill: pet?.pillMedication ? true : false,
        topical: pet?.topicalMedication ? true : false,
        injection: pet?.injectionMedication ? true : false,
        breeds: dbBredds,
        gallery: dbGallery,
      },
    };
  }

  async deletePet(userId: bigint, opk: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const pet = await this.prismaService.pet.findFirst({
      where: { userId, opk, deletedAt: null },
    });

    throwBadRequestErrorCheck(!pet, 'Pet not found.');

    const dbPet = await this.prismaService.pet.update({
      where: {
        id: pet?.id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    throwBadRequestErrorCheck(!dbPet, 'Pet can not deleted now.');

    return {
      message: 'Pet deleted successfully.',
      data: dbPet,
    };
  }

  async getAllPhoto(userId: bigint, opk: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const pet = await this.prismaService.pet.findFirst({
      where: { userId, opk, deletedAt: null },
    });

    throwBadRequestErrorCheck(!pet, 'Pet not found.');

    const photos = await this.prismaService.petGallery.findMany({
      where: {
        petId: pet?.id,
        deletedAt: null,
      },
      select: {
        id: true,
        petId: true,
        imageSrc: true,
        caption: true,
        sequence: true,
        profileImage: true,
        responsive: true,
        public: true,
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

  async uploadPhoto(userId: bigint, opk: string, file: Express.Multer.File) {
    throwBadRequestErrorCheck(!file[0], 'No file uploaded.');

    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const pet = await this.prismaService.pet.findFirst({
      where: { userId, opk, deletedAt: null },
    });

    throwBadRequestErrorCheck(!pet, 'Pet not found.');

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

    const photoCount = await this.prismaService.petGallery.aggregate({
      where: {
        petId: pet?.id,
      },
      _count: {
        id: true,
      },
    });

    const photo = await this.prismaService.petGallery.create({
      data: {
        petId: pet?.id,
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
    opk: string,
    photoInfo: GalleryPhotoUpdateDto,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const pet = await this.prismaService.pet.findFirst({
      where: { userId, opk, deletedAt: null },
    });

    throwBadRequestErrorCheck(!pet, 'Pet not found.');

    let photo = await this.prismaService.petGallery.findFirst({
      where: {
        id,
        petId: pet?.id,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!photo, 'Photo not found.');

    const { caption } = photoInfo;

    photo = await this.prismaService.petGallery.update({
      where: {
        id,
      },
      data: {
        petId: pet?.id,
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
    opk: string,
    galleryPhotosDragDropDto: GalleryPhotosDragDropDto,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const pet = await this.prismaService.pet.findFirst({
      where: { userId, opk, deletedAt: null },
    });

    throwBadRequestErrorCheck(!pet, 'Pet not found.');

    let { photos } = galleryPhotosDragDropDto;

    const promises = [];

    for (let i = 0; i < photos?.length; i++) {
      promises.push(
        await this.prismaService.petGallery.update({
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
    photos = await this.getAllPhoto(userId, opk);

    throwBadRequestErrorCheck(!photos?.data, 'Could not drag and drop photos.');

    return photos;
  }

  async deletePhoto(userId: bigint, opk: string, id: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const pet = await this.prismaService.pet.findFirst({
      where: { userId, opk, deletedAt: null },
    });

    throwBadRequestErrorCheck(!pet, 'Pet not found.');

    let photo = await this.prismaService.petGallery.findFirst({
      where: {
        id,
        petId: pet?.id,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!photo, 'Photo not found.');

    photo = await this.prismaService.petGallery.update({
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
