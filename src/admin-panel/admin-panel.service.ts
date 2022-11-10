import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import { AppointmentStatusEnum } from 'src/appointment/helpers/appointment-enum';
import { AuthService } from 'src/auth/auth.service';
import { LoginDto } from 'src/auth/dto/login.dto';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
  throwUnauthorizedErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { ProviderServiceToggleDto } from './dto/provider-service.toggle.dto';

@Injectable()
export class AdminPanelService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
    private readonly secretService: SecretService,
  ) {}

  async adminCheck(userId: bigint) {
    const admin = await this.prismaService.admin.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    return admin ? true : false;
  }

  async adminLogin(loginDto: LoginDto, res: any) {
    const { email } = loginDto;

    const user = await this.prismaService.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(user?.id)) || !user,
      'Unauthorized',
    );

    return await this.authService.validateUser(loginDto, res);
  }

  async getLandingPageDetails(userId: bigint) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );

    const [
      userCount,
      providerCount,
      appointmentCount,
      presentMonthAppointmentCount,
    ] = await this.prismaService.$transaction([
      this.prismaService.user.count(),
      this.prismaService.provider.count(),
      this.prismaService.appointment.count(),
      this.prismaService.appointment.count({
        where: {
          AND: [
            {
              createdAt: {
                gte: new Date(format(new Date(), 'yyyy-MM')),
              },
            },
            {
              createdAt: {
                lte: new Date(),
              },
            },
          ],
        },
      }),
    ]);

    return {
      message: 'Home page data found successfully.',
      data: {
        userCount,
        providerCount,
        appointmentCount,
        presentMonthAppointmentCount,
      },
    };
  }

  async getAllUsers(userId: bigint, email: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );
    const users = await this.prismaService.user.findMany({
      where: {
        email,
      },
      select: {
        id: true,
        opk: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        zipcode: true,
        image: true,
        loginProvider: true,
        timezone: true,
        facebook: true,
        google: true,
        meta: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    throwNotFoundErrorCheck(users?.length <= 0, 'Users not found.');

    return {
      messages: 'Users found successfully.',
      data: users,
    };
  }

  async getUserDetails(userId: bigint, email: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );
    const user = await this.prismaService.user.findFirst({
      where: {
        email: email ?? '',
      },
      select: {
        id: true,
        opk: true,
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        zipcode: true,
        image: true,
        loginProvider: true,
        timezone: true,
        facebook: true,
        google: true,
        meta: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        provider: true,
        basicInfo: true,
        contact: true,
        emergencyContact: true,
        Gallery: true,
        pet: true,
        userStripeCustomerAccount: true,
        userStripeCard: true,
        userSubscriptions: true,
        userSubscriptionInvoices: true,
        appointment: true,
      },
    });

    throwNotFoundErrorCheck(!user, 'User not found.');

    return {
      messages: 'User details found successfully.',
      data: user,
    };
  }

  async userPermanentBlock(userId: bigint, email: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );

    const user = await this.prismaService.user.findFirst({
      where: {
        email: email ?? '',
      },
    });

    throwNotFoundErrorCheck(!user, 'User not found.');

    const updatedUser = await this.prismaService.user.update({
      where: {
        id: user?.id,
      },
      data: {
        deletedAt: user?.deletedAt ? null : new Date(),
      },
    });

    throwBadRequestErrorCheck(
      !updatedUser,
      'User permanent block can not toggle now.',
    );

    return {
      messages: 'User permanent block toggled successfully.',
      data: updatedUser,
    };
  }

  async getAllProviders(userId: bigint, email: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );
    const providers = await this.prismaService.provider.findMany({
      where: {
        user: {
          email,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            opk: true,
            email: true,
            emailVerified: true,
            firstName: true,
            lastName: true,
            zipcode: true,
            image: true,
            loginProvider: true,
            timezone: true,
            facebook: true,
            google: true,
            meta: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        },
      },
    });

    throwNotFoundErrorCheck(providers?.length <= 0, 'Providers not found.');

    return {
      messages: 'Providers found successfully.',
      data: providers,
    };
  }

  async getProviderDetails(userId: bigint, email: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );
    const provider = await this.prismaService.provider.findFirst({
      where: {
        user: {
          email: email ?? '',
        },
      },
      include: {
        backgroundCheck: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        providerServices: {
          include: {
            ServiceHasRates: {
              include: {
                serviceTypeRate: {
                  include: {
                    serviceRateType: true,
                  },
                },
              },
            },
            serviceType: true,
          },
        },
        providerDetails: true,
        providerSkills: {
          where: {
            deletedAt: null,
          },
          include: {
            skillType: true,
          },
        },
        HomeAttributes: {
          include: {
            homeAttributeType: true,
          },
        },
        ServicePetPreference: true,
        providerCheckrCandidate: true,
        zoomInfo: true,
        appointment: true,
        user: {
          select: {
            id: true,
            opk: true,
            email: true,
            emailVerified: true,
            firstName: true,
            lastName: true,
            zipcode: true,
            image: true,
            loginProvider: true,
            timezone: true,
            facebook: true,
            google: true,
            meta: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            basicInfo: true,
            contact: true,
            emergencyContact: true,
            Gallery: true,
            pet: true,
            userStripeCustomerAccount: true,
            userStripeCard: true,
            userSubscriptions: true,
            userSubscriptionInvoices: true,
          },
        },
      },
    });

    throwNotFoundErrorCheck(!provider, 'Provider not found.');

    return {
      messages: 'Provider details found successfully',
      data: provider,
    };
  }

  async toggleProviderApproval(userId: bigint, email: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );

    const provider = await this.prismaService.provider.findFirst({
      where: {
        user: {
          email: email ?? '',
        },
        deletedAt: null,
      },
    });

    throwNotFoundErrorCheck(!provider, 'Provider not found.');

    const updatedProvider = await this.prismaService.provider.update({
      where: {
        id: provider?.id,
      },
      data: {
        isApproved: !provider?.isApproved,
        profileSubmitted: true,
      },
    });

    throwBadRequestErrorCheck(
      !updatedProvider,
      'Provider approval can not toggle now.',
    );

    return {
      messages: 'Provider approval toggled successfully.',
      data: updatedProvider,
    };
  }

  async toggleProviderServiceApproval(
    userId: bigint,
    email: string,
    providerServiceToggleDto: ProviderServiceToggleDto,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );

    const provider = await this.prismaService.provider.findFirst({
      where: {
        user: {
          email: email ?? '',
        },
      },
    });

    throwNotFoundErrorCheck(!provider, 'Provider not found.');

    const { providerServiceId } = providerServiceToggleDto;

    let providerService = await this.prismaService.providerServices.findMany({
      where: {
        id: {
          in: providerServiceId,
        },
      },
    });

    const promises = [];

    for (let i = 0; i < providerService?.length; i++) {
      promises.push(
        await this.prismaService.providerServices.update({
          where: {
            id: providerService[i]?.id,
          },
          data: {
            isApproved: !providerService[i]?.isApproved,
          },
        }),
      );
    }

    await Promise.allSettled(promises);

    providerService = await this.prismaService.providerServices.findMany({
      where: {
        id: {
          in: providerServiceId,
        },
      },
    });

    return {
      messages: 'Provider service approval toggled successfully.',
      data: providerService,
    };
  }

  async providerBackgroundCheck(userId: bigint, email: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );

    const provider = await this.prismaService.provider.findFirst({
      where: {
        user: {
          email: email ?? '',
        },
      },
      include: {
        backgroundCheck: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    throwNotFoundErrorCheck(!provider, 'Provider not found.');

    throwBadRequestErrorCheck(
      provider?.backgroundCheck?.length <= 0,
      'Need to update background check.',
    );
    if (provider?.backGroundCheck == 'PLATINUM') {
      throwBadRequestErrorCheck(
        provider?.backgroundCheck[0]?.value < 3,
        'Need to update background check.',
      );
    } else if (provider?.backGroundCheck == 'GOLD') {
      throwBadRequestErrorCheck(
        provider?.backgroundCheck[0]?.value < 2,
        'Need to update background check.',
      );
    } else if (provider?.backGroundCheck == 'BASIC') {
      throwBadRequestErrorCheck(
        provider?.backgroundCheck[0]?.value < 1,
        'Need to update background check.',
      );
    }

    const updatedProvider = await this.prismaService.provider.update({
      where: {
        id: provider?.id,
      },
      data: {
        isApproved: !provider?.isApproved,
      },
    });

    throwBadRequestErrorCheck(
      !updatedProvider,
      'Provider approval can not toggle now.',
    );

    return {
      messages: 'Provider background checked successfully.',
      data: provider,
    };
  }

  async updateroviderBackgroundCheck(userId: bigint, email: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );

    const provider = await this.prismaService.provider.findFirst({
      where: {
        user: {
          email: email ?? '',
        },
      },
      include: {
        backgroundCheck: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    throwNotFoundErrorCheck(!provider, 'Provider not found.');
    if (provider?.backGroundCheck == provider?.backgroundCheck[0]?.type) {
      return {
        messages: 'Provider background checked already up to date.',
        data: provider,
      };
    }

    const backgroundCheckValue = {
      NONE: 0,
      BASIC: 1,
      GOLD: 2,
      PLATINUM: 3,
    };

    const updateBackgroundCheck =
      await this.prismaService.backgroundCheck.create({
        data: {
          providerId: provider?.id,
          type: provider?.backGroundCheck,
          value: backgroundCheckValue[provider?.backGroundCheck],
        },
      });

    throwBadRequestErrorCheck(
      !updateBackgroundCheck,
      'Provider approval can not toggle now.',
    );

    return {
      messages: 'Provider background checked successfully.',
      data: {
        ...provider,
        updateBackgroundCheck,
      },
    };
  }

  async getAllAppointments(userId: bigint, opk: string, status: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );

    throwBadRequestErrorCheck(
      status ? !(status in AppointmentStatusEnum) : false,
      'Enter a valid status enum value.',
    );

    const appointments = await this.prismaService.appointment.findMany({
      where: {
        opk,
        status: status as AppointmentStatusEnum,
      },
      include: {
        user: true,
        provider: {
          include: {
            user: true,
          },
        },
        providerService: {
          include: {
            serviceType: true,
          },
        },
      },
    });

    throwNotFoundErrorCheck(
      appointments?.length <= 0,
      'Appointments not found.',
    );

    return {
      messages: 'Appointments found successfully.',
      data: appointments,
    };
  }

  async getAppointmentDetails(userId: bigint, opk: string) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );
    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        opk: opk ?? '',
      },
      include: {
        user: true,
        provider: {
          include: {
            user: true,
          },
        },
        providerService: {
          include: {
            ServiceHasRates: {
              include: {
                serviceTypeRate: {
                  include: {
                    serviceRateType: true,
                  },
                },
              },
            },
            serviceType: true,
          },
        },
        appointmentProposal: true,
        appointmentPet: true,
      },
    });

    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');

    return {
      messages: 'Appointment details found successfully.',
      data: appointment,
    };
  }

  async getTransactionCountDetails(
    userId: bigint,
    startDate: string,
    endDate: string,
  ) {
    throwUnauthorizedErrorCheck(
      !(await this.adminCheck(userId)),
      'Unauthorized',
    );

    const [user, provider, userSubscriptionInvoices] =
      await this.prismaService.$transaction([
        this.prismaService.user.findMany({
          where: {
            AND: [
              {
                createdAt: {
                  gte: startDate
                    ? new Date(startDate)
                    : new Date(
                        this.secretService.getAdminPanelCreds().searchStartDate,
                      ),
                },
              },
              {
                createdAt: {
                  lte: endDate ? new Date(endDate) : new Date(),
                },
              },
            ],
          },
          select: {
            id: true,
            createdAt: true,
          },
        }),
        this.prismaService.provider.findMany({
          where: {
            AND: [
              {
                createdAt: {
                  gte: startDate
                    ? new Date(startDate)
                    : new Date(
                        this.secretService.getAdminPanelCreds().searchStartDate,
                      ),
                },
              },
              {
                createdAt: {
                  lte: endDate ? new Date(endDate) : new Date(),
                },
              },
            ],
          },
          select: {
            id: true,
            isApproved: true,
            subscriptionType: true,
            backGroundCheck: true,
            profileSubmitted: true,
            createdAt: true,
          },
        }),
        this.prismaService.userSubscriptionInvoices.findMany({
          where: {
            AND: [
              {
                createdAt: {
                  gte: startDate
                    ? new Date(startDate)
                    : new Date(
                        this.secretService.getAdminPanelCreds().searchStartDate,
                      ),
                },
              },
              {
                createdAt: {
                  lte: endDate ? new Date(endDate) : new Date(),
                },
              },
            ],
          },
          select: {
            id: true,
            stripeInvoiceId: true,
            customerStripeId: true,
            customerEmail: true,
            customerName: true,
            total: true,
            subTotal: true,
            amountDue: true,
            amountPaid: true,
            amountRemaining: true,
            billingReason: true,
            currency: true,
            billingDate: true,
            status: true,
            invoicePdf: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      messages: 'Appointment details found successfully.',
      data: {
        user,
        provider,
        userSubscriptionInvoices,
      },
    };
  }
}
