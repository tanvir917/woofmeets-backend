import { Injectable } from '@nestjs/common';
import {
  throwBadRequestErrorCheck,
  throwUnauthorizedErrorCheck,
} from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { compareVersions } from 'compare-versions';
import { UpdateUserApplicationVersionDto } from './dto/update-user-application-version.dto';
// const gplay = require('google-play-scraper');
import gplay from 'google-play-scraper';
import appleStore from 'app-store-scraper';
import { GetForceUpdateQueryDto } from './dto/get-force-update-query.dto';
import { AdminPanelService } from '../admin-panel/admin-panel.service';
import { PlatformTypeEnum } from './entities/platform-type.entity';
import { SecretService } from '../secret/secret.service';

@Injectable()
export class UserApplicationVersionService {
  GoogleAppStoreId: string;
  AppleAppStoreId: string;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly adminPanelService: AdminPanelService,
    private readonly secretService: SecretService,
  ) {
    this.GoogleAppStoreId = this.secretService.getAppStoreCreds().googleStoreId;
    this.AppleAppStoreId = this.secretService.getAppStoreCreds().appleStoreId;
  }

  async compareUserAppVersion(query: GetForceUpdateQueryDto) {
    const { version, platform } = query;

    const dbVersions =
      await this.prismaService.userApplicationVersion.findFirst({
        where: {
          deletedAt: null,
        },
      });

    let latestAppVersion: string;
    let isForceUpdate: boolean;
    let storeRedirectUrl: string;

    if (platform === PlatformTypeEnum.ANDROID) {
      const result = await gplay.app({
        appId: this.GoogleAppStoreId,
      });
      throwBadRequestErrorCheck(!result, 'Google play store not be connected');
      latestAppVersion = result?.version;
      isForceUpdate = dbVersions?.androidForceUpdateVersion
        ? compareVersions(dbVersions?.androidForceUpdateVersion, version) === 1
        : false;
      storeRedirectUrl = dbVersions?.androidStoreUrl;
    } else if (platform === PlatformTypeEnum.IOS) {
      const result = await appleStore.app({ id: this.AppleAppStoreId });
      throwBadRequestErrorCheck(!result, 'Apple store not be connected');
      latestAppVersion = result?.version;
      isForceUpdate = dbVersions?.iosForceUpdateVersion
        ? compareVersions(dbVersions?.iosForceUpdateVersion, version) === 1
        : false;
      storeRedirectUrl = dbVersions?.iosStoreUrl;
    }

    const isUpdateAvailable = compareVersions(latestAppVersion, version) === 1;

    return {
      message: 'User application informations.',
      data: {
        isForceUpdate,
        isUpdateAvailable,
        latestAppVersion,
        version,
        androidForceUpdateVersion: dbVersions?.androidForceUpdateVersion,
        iosForceUpdateVersion: dbVersions?.iosForceUpdateVersion,
        storeRedirectUrl,
      },
    };
  }

  async postOrUpdateAppVersion(
    userId: bigint,
    updateUserApplicationVersionDto: UpdateUserApplicationVersionDto,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    const {
      version,
      iosForceUpdateVersion,
      androidForceUpdateVersion,
      androidStoreUrl,
      iosStoreUrl,
      meta,
    } = updateUserApplicationVersionDto;

    throwBadRequestErrorCheck(
      meta == null,
      "Meta can't be null. Please provide empty object instead.",
    );

    const dbVersions =
      await this.prismaService.userApplicationVersion.findFirst({
        where: {
          deletedAt: null,
        },
      });

    const userAppVersion =
      await this.prismaService.userApplicationVersion.upsert({
        where: {
          id: dbVersions?.id,
        },
        update: {
          version: version,
          iosForceUpdateVersion: iosForceUpdateVersion,
          androidForceUpdateVersion: androidForceUpdateVersion,
          androidStoreUrl: androidStoreUrl,
          iosStoreUrl: iosStoreUrl,
          meta: meta,
        },
        create: {
          version: version,
          iosForceUpdateVersion: iosForceUpdateVersion,
          androidForceUpdateVersion: androidForceUpdateVersion,
          androidStoreUrl: androidStoreUrl,
          iosStoreUrl: iosStoreUrl,
          meta: meta,
        },
      });

    throwBadRequestErrorCheck(
      !userAppVersion,
      'User application version can not be created or updated! Please try again.',
    );

    return {
      message: 'Application version information created or updated',
      data: userAppVersion,
    };
  }

  async getApplicationVersion(userId: bigint) {
    throwUnauthorizedErrorCheck(
      !(await this.adminPanelService.adminCheck(userId)),
      'Unauthorized access!',
    );

    const dbVersions =
      await this.prismaService.userApplicationVersion.findFirst({
        where: {
          deletedAt: null,
        },
      });

    return {
      message: 'Application version information',
      data: dbVersions,
    };
  }
}
