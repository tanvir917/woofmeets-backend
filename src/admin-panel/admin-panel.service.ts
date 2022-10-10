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

@Injectable()
export class AdminPanelService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
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
      messages: 'Users found successfully',
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
      messages: 'User details found successfully',
      data: user,
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
      messages: 'Providers found successfully',
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
        providerServices: true,
        providerDetails: true,
        ServicePetPreference: true,
        HomeAttributes: true,
        providerSkills: true,
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
        provider: true,
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
      messages: 'Appointments found successfully',
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
        provider: true,
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
      messages: 'Appointment details found successfully',
      data: appointment,
    };
  }
}
