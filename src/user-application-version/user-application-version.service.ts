import { Injectable } from '@nestjs/common';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserApplicationVersionDto } from './dto/update-user-application-version.dto';

@Injectable()
export class UserApplicationVersionService {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserAppVersion(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        userApplicationVersion: true,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    throwBadRequestErrorCheck(
      !user?.userApplicationVersion,
      'User application version not found',
    );

    return {
      message: 'User application version found',
      data: user?.userApplicationVersion,
    };
  }

  async postOrUpdateUserAppVersion(
    userId: bigint,
    updateUserApplicationVersionDto: UpdateUserApplicationVersionDto,
  ) {
    const { version, meta } = updateUserApplicationVersionDto;

    throwBadRequestErrorCheck(
      meta == null,
      "Meta can't be null. Please provide empty object instead.",
    );

    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found');

    const userAppVersion =
      await this.prismaService.userApplicationVersion.upsert({
        where: {
          userId: userId,
        },
        update: {
          version: version,
          meta: meta,
        },
        create: {
          userId: userId,
          version: version,
          meta: meta,
        },
      });

    throwBadRequestErrorCheck(
      !userAppVersion,
      'User application version can not be created or updated! Please try again.',
    );

    return {
      message: 'User application version created or updated',
      data: userAppVersion,
    };
  }
}
