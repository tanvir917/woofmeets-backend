import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { EmailService } from 'src/email/email.service';
import { SuccessfulUploadResponse } from 'src/file/dto/upload-flie.dto';
import { MulterFileUploadService } from 'src/file/multer-file-upload-service';
import { throwNotFoundErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SmsService } from 'src/sms/sms.service';
import { CreateAppointmentCardDto } from '../dto/create-appointment-card.dto';
import { UpdateAppointmentCardDto } from '../dto/update-appointment-card.dto';
import { AppointmentProposalService } from './appointment-proposal.service';

@Injectable()
export class AppointmentCardService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly appointmentProposalService: AppointmentProposalService,
    private readonly multerFileUploadService: MulterFileUploadService,
  ) {
    this.logger.setContext(AppointmentCardService.name);
  }

  async getAppointmentDates(userId: bigint, opk: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(!user, 'User not found.');

    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        opk,
        deletedAt: null,
      },
      include: {
        providerService: {
          include: {
            serviceType: true,
          },
        },
      },
    });

    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');

    const appointmentDates = await this.prismaService.appointmentDates.findMany(
      {
        where: {
          appointmentId: appointment?.id,
          deletedAt: null,
        },
      },
    );

    throwNotFoundErrorCheck(
      appointmentDates?.length <= 0,
      'Appointment dates not found.',
    );

    const sortDateByTime = appointmentDates?.sort(function (x, y) {
      return new Date(x?.date).getTime() - new Date(y?.date).getTime();
    });

    let updateAppointmentDates = [];

    if (
      appointment?.providerService?.serviceType?.slug === 'boarding' ||
      appointment?.providerService?.serviceType?.slug === 'house-sitting'
    ) {
      updateAppointmentDates.push(sortDateByTime[0]);
      updateAppointmentDates.push(sortDateByTime[sortDateByTime?.length - 1]);
    } else {
      updateAppointmentDates = sortDateByTime;
    }

    return {
      message: 'Appointment dates found successfully.',
      data: updateAppointmentDates,
    };
  }

  async startAppointment(
    userId: bigint,
    appointmentDateId: bigint,
    startTime: string,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(!user, 'User not found.');

    const appointmentDate = await this.prismaService.appointmentDates.findFirst(
      {
        where: {
          id: appointmentDateId,
          deletedAt: null,
        },
      },
    );

    throwNotFoundErrorCheck(!appointmentDate, 'Appointment dates not found.');

    const updateAppointmentDate =
      await this.prismaService.appointmentDates.update({
        where: {
          id: appointmentDate?.id,
        },
        data: {
          startTime,
        },
      });

    throwNotFoundErrorCheck(
      !updateAppointmentDate,
      'Appointment can not start now. Try again after some time.',
    );

    return {
      message: 'Appointment start successfully.',
      data: updateAppointmentDate,
    };
  }

  async stopAppointment(
    userId: bigint,
    appointmentDateId: bigint,
    stopTime: string,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(!user, 'User not found.');

    const appointmentDate = await this.prismaService.appointmentDates.findFirst(
      {
        where: {
          id: appointmentDateId,
          deletedAt: null,
        },
      },
    );

    throwNotFoundErrorCheck(!appointmentDate, 'Appointment dates not found.');

    const updateAppointmentDate =
      await this.prismaService.appointmentDates.update({
        where: {
          id: appointmentDate?.id,
        },
        data: {
          stopTime,
        },
      });

    throwNotFoundErrorCheck(
      !updateAppointmentDate,
      'Appointment can not stop now. Try again after some time.',
    );

    return {
      message: 'Appointment stop successfully.',
      data: updateAppointmentDate,
    };
  }

  async findAppointmentCardPets(userId: bigint, opk: string) {
    const [user, appointment] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: {
          provider: true,
        },
      }),
      this.prismaService.appointment.findFirst({
        where: {
          opk,
          deletedAt: null,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');

    const appointmentPets = await this.prismaService.appointmentPet.findMany({
      where: {
        appointmentId: appointment?.id,
        proposalId: appointment?.lastProposalId,
        deletedAt: null,
      },
      include: {
        pet: true,
      },
    });

    const petsId = appointmentPets?.map((item) => {
      return item?.petId;
    });

    const pets = await this.prismaService.pet.findMany({
      where: {
        id: {
          in: petsId,
        },
        deletedAt: null,
      },
    });

    return {
      message: 'Appointment card pets found successfully.',
      data: pets,
    };
  }

  async appointmentCardUploadFile(
    userId: bigint,
    opk: string,
    appointmentDateId: bigint,
    files: Express.Multer.File[], //: Promise<SuccessfulUploadResponse[]>
  ): Promise<SuccessfulUploadResponse[]> {
    const [user, appointment, appointmentDate] =
      await this.prismaService.$transaction([
        this.prismaService.user.findFirst({
          where: {
            id: userId,
            deletedAt: null,
          },
        }),
        this.prismaService.appointment.findFirst({
          where: {
            opk,
            deletedAt: null,
          },
        }),
        this.prismaService.appointmentDates.findFirst({
          where: {
            id: appointmentDateId,
            appointment: {
              opk,
            },
            deletedAt: null,
          },
        }),
      ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');
    throwNotFoundErrorCheck(!appointmentDate, 'Appointment date not found.');
    const uploadedFiles = await this.multerFileUploadService.uploadMultiple(
      files,
      `appointment/card/${opk}/appointment-date/${appointmentDateId}`,
    );

    return uploadedFiles;
  }

  async findAllCardOfAppointment(userId: bigint, appointmentOpk: string) {
    const [user, appointment] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: {
          provider: true,
        },
      }),
      this.prismaService.appointment.findFirst({
        where: {
          opk: appointmentOpk,
          deletedAt: null,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');

    const appointmentCards = await this.prismaService.appointmentCard.findMany({
      where: {
        appointmentId: appointment?.id,
        deletedAt: null,
      },
    });

    throwNotFoundErrorCheck(
      appointmentCards?.length <= 0,
      'Appointment cards not found.',
    );

    return {
      message: 'Appointment cards found successfully.',
      data: appointmentCards,
    };
  }

  async findAppointmentCardById(userId: bigint, id: bigint) {
    const [user, appointmentCard] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: {
          provider: true,
        },
      }),
      this.prismaService.appointmentCard.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointmentCard, 'Appointment card not found.');

    return {
      message: 'Appointment card found successfully.',
      data: appointmentCard,
    };
  }

  async createAppointmentCard(
    userId: bigint,
    createAppointmentCardDto: CreateAppointmentCardDto,
  ) {
    const { appointmentId, appointmentDateId } = createAppointmentCardDto;
    const [user, appointment, appointmentDate] =
      await this.prismaService.$transaction([
        this.prismaService.user.findFirst({
          where: {
            id: userId,
            deletedAt: null,
          },
        }),
        this.prismaService.appointment.findFirst({
          where: {
            id: appointmentId,
            deletedAt: null,
          },
        }),
        this.prismaService.appointmentDates.findFirst({
          where: {
            id: appointmentDateId,
            appointmentId,
            deletedAt: null,
          },
        }),
      ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');
    throwNotFoundErrorCheck(!appointmentDate, 'Appointment date not found.');

    const {
      images,
      petsData,
      medication,
      additionalNotes,
      totalWalkTime,
      distance,
      distanceUnit,
      generateTime,
      submitTime,
    } = createAppointmentCardDto;

    const appointmentCard = await this.prismaService.appointmentCard.create({
      data: {
        appointmentId,
        appointmentDateId,
        images,
        petsData,
        medication,
        additionalNotes,
        totalWalkTime,
        distance,
        distanceUnit,
        generateTime,
        submitTime,
      },
    });

    throwNotFoundErrorCheck(
      !appointmentCard,
      'Appointment card can not create now.',
    );

    return {
      message: 'Appointment card created successfully.',
      data: appointmentCard,
    };
  }

  async updateAppointmentCard(
    userId: bigint,
    id: bigint,
    updateAppointmentCardDto: UpdateAppointmentCardDto,
  ) {
    const [user, appointmentCard] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: {
          provider: true,
        },
      }),
      this.prismaService.appointmentCard.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointmentCard, 'Appointment card not found.');

    const {
      images,
      petsData,
      medication,
      additionalNotes,
      totalWalkTime,
      distance,
      distanceUnit,
      generateTime,
      submitTime,
    } = updateAppointmentCardDto;

    const updateAppointmentCard =
      await this.prismaService.appointmentCard.update({
        where: {
          id: appointmentCard?.id,
        },
        data: {
          images,
          petsData,
          medication,
          additionalNotes,
          totalWalkTime,
          distance,
          distanceUnit,
          generateTime,
          submitTime,
        },
      });

    throwNotFoundErrorCheck(
      !updateAppointmentCard,
      'Appointment card can not update now.',
    );

    return {
      message: 'Appointment card updated successfully.',
      data: updateAppointmentCard,
    };
  }

  async checkAppointmentReport(
    userId: bigint,
    appointmentId: bigint,
    appointmentDateId: bigint,
  ) {
    const [user, appointmentCard] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: {
          provider: true,
        },
      }),
      this.prismaService.appointmentCard.findFirst({
        where: {
          appointmentId,
          appointmentDateId,
          deletedAt: null,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    if (!appointmentCard) {
      return {
        message: 'Appointment report not found.',
        data: {
          cardFound: false,
          appointmentCard,
        },
      };
    }

    return {
      message: 'Appointment report found successfully.',
      data: {
        cardFound: true,
        appointmentCard,
      },
    };
  }
}
