import { Injectable } from '@nestjs/common';
import { ProviderCheckrCandidate } from '@prisma/client';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { ProviderSubscriptionTypeEnum } from '../subscriptions/entities/subscription.entity';
import { BackgroundCheckEnum } from './entities/checkr.entity';

@Injectable()
export class CheckrService {
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
  ) {}

  async initiateBackgourndCheck(
    userId: bigint,
    subscriptionType: ProviderSubscriptionTypeEnum,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        provider: true,
      },
    });

    let packageId: string;
    let backGroundCheckEnum: BackgroundCheckEnum;

    if (subscriptionType === ProviderSubscriptionTypeEnum.GOLD) {
      packageId = 'basic_plus_criminal';
      backGroundCheckEnum = BackgroundCheckEnum.GOLD;
    } else if (subscriptionType === ProviderSubscriptionTypeEnum.PLATINUM) {
      packageId = 'essential_criminal';
      backGroundCheckEnum = BackgroundCheckEnum.PLATINUM;
    }

    try {
      const candidate = await axios.post(
        `${this.secretService.getCheckrCreds().baseUrl}/candidates`,
        {
          first_name: user?.firstName,
          last_name: user?.lastName,
          email: user?.email,
        },
        {
          auth: {
            username: this.secretService.getCheckrCreds().apiSecret,
            password: '',
          },
        },
      );

      let dbCandidate: ProviderCheckrCandidate;

      if (candidate?.data) {
        dbCandidate = await this.prismaService.providerCheckrCandidate.create({
          data: {
            candidateId: candidate?.data?.id,
            providerId: user?.provider?.id,
            firstName: candidate?.data?.first_name,
            lastName: candidate?.data?.last_name,
            email: candidate?.data?.email,
            phone: candidate?.data?.phone,
            reportIds: candidate?.data?.report_ids,
            geoIds: candidate?.data?.geo_ids,
            adjugation: candidate?.data?.adjudication,
            src: Object(candidate?.data),
          },
        });
      }

      const invitation = await axios.post(
        `${this.secretService.getCheckrCreds().baseUrl}/invitations`,
        {
          candidate_id: candidate?.data?.candidateId,
          package: packageId,
        },
        {
          auth: {
            username: process.env.CKR_API_SECRET,
            password: '',
          },
        },
      );

      console.log('Invitaion: ', invitation?.data);

      if (invitation?.data) {
        await this.prismaService.providerCheckrInvitation.create({
          data: {
            invitationId: invitation?.data?.id,
            providerCheckrCandidateId: dbCandidate?.id,
            package: invitation?.data?.package,
            status: invitation?.data?.status,
            reportId: invitation?.data?.report_id,
            uri: invitation?.data?.uri ?? '',
            url: invitation?.data?.invitation_url ?? '',
            src: Object(invitation?.data),
          },
        });
      }

      await this.prismaService.provider.update({
        where: {
          id: user?.provider?.id,
        },
        data: {
          backGroundCheck: backGroundCheckEnum,
        },
      });
    } catch (e) {
      console.log(e.response.data.error);
    }
  }
}
