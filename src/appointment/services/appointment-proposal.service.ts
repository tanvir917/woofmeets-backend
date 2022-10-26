import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { appointmentProposalEnum, appointmentStatusEnum } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { CommonService } from 'src/common/common.service';
import { SuccessfulUploadResponse } from 'src/file/dto/upload-flie.dto';
import { MulterFileUploadService } from 'src/file/multer-file-upload-service';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { MessagingProxyService } from 'src/messaging/messaging.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderServicesService } from 'src/provider-services/provider-services.service';
import { SecretService } from 'src/secret/secret.service';
import { latlongDistanceCalculator } from 'src/utils/tools';
import { CreateAppointmentProposalDto } from '../dto/create-appointment-proposal.dto';
import { PetsCheckDto } from '../dto/pet-check.dto';
import { UpdateAppointmentProposalDto } from '../dto/update-appointment-proposal.dto';
import { AppointmentStatusEnum } from '../helpers/appointment-enum';

@Injectable()
export class AppointmentProposalService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly commonService: CommonService,
    private readonly providerServicesService: ProviderServicesService,
    private readonly secretService: SecretService,
    private readonly messageService: MessagingProxyService,
    private readonly multerFileUploadService: MulterFileUploadService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AppointmentProposalService.name);
  }

  async dispatchNotification() {
    // send notification to the other user
    // via message and push notification or text and email
    return 'notification dispatched';
  }

  async getProviderServices(opk: string) {
    const user = await this.prismaService.user.findFirst({
      where: { opk, deletedAt: null },
    });

    throwNotFoundErrorCheck(!user, 'Provider not found.');

    const providerService = await this.providerServicesService.findAll(
      user?.id,
    );

    return providerService;
  }

  async getProviderServiceAdditionalRates(opk: string) {
    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        opk,
        deletedAt: null,
      },
    });

    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');

    const providerServiceDetails =
      await this.prismaService.providerServices.findFirst({
        where: {
          id: appointment?.providerServiceId,
          deletedAt: null,
        },
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
      });

    return {
      result: 'Provider service details found successfully',
      data: providerServiceDetails,
    };
  }

  async appointmentDistanceCheck(userId: bigint, providerId: bigint) {
    const [user, provider] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: {
          basicInfo: {
            select: {
              latitude: true,
              longitude: true,
            },
          },
        },
      }),
      this.prismaService.provider.findFirst({
        where: {
          id: providerId,
          deletedAt: null,
        },
        select: {
          user: {
            select: {
              basicInfo: {
                select: {
                  latitude: true,
                  longitude: true,
                },
              },
            },
          },
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!provider, 'Provider not found');

    const distance =
      user?.basicInfo?.latitude &&
      user?.basicInfo?.longitude &&
      provider?.user?.basicInfo?.latitude &&
      provider?.user?.basicInfo?.longitude
        ? latlongDistanceCalculator(
            provider?.user?.basicInfo?.latitude,
            provider?.user?.basicInfo?.longitude,
            user?.basicInfo?.latitude,
            user?.basicInfo?.longitude,
          )
        : null;

    return {
      message: 'Appointment distance calculated successfully.',
      data: {
        distance,
        crossLimit:
          distance >= this.secretService.getAppointmentCreds().distanceLimit
            ? true
            : false,
      },
    };
  }

  async appointmentsPetsCheck(petsCheckDto: PetsCheckDto) {
    const { providerId, petsId } = petsCheckDto;
    const [provider, pets] = await this.prismaService.$transaction([
      this.prismaService.provider.findFirst({
        where: {
          id: providerId,
          deletedAt: null,
        },
        select: {
          ServicePetPreference: true,
        },
      }),
      this.prismaService.pet.findMany({
        where: {
          id: {
            in: petsId,
          },
          deletedAt: null,
        },
        select: {
          type: true,
          weight: true,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!pets, 'Pets not found.');

    let catCheck = true;
    let dogCheck = true;

    for (let i = 0; i < pets?.length; i++) {
      if (pets[i].type == 'CAT') {
        catCheck = provider?.ServicePetPreference?.cat;
      } else if (dogCheck == true) {
        if (pets[i]?.weight >= 0 && pets[i].weight <= 15) {
          dogCheck = provider?.ServicePetPreference?.smallDog;
        } else if (pets[i]?.weight >= 16 && pets[i].weight <= 40) {
          dogCheck = provider?.ServicePetPreference?.mediumDog;
        } else if (pets[i]?.weight >= 41 && pets[i].weight <= 100) {
          dogCheck = provider?.ServicePetPreference?.largeDog;
        } else if (pets[i]?.weight > 100) {
          dogCheck = provider?.ServicePetPreference?.giantDog;
        }
      }
    }

    return {
      message: 'Appointment pets checked successfully.',
      data: {
        catCheck,
        dogCheck,
      },
    };
  }

  async getAllAppointments(userId: bigint, status: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(!user, 'User not found.');

    throwBadRequestErrorCheck(
      status ? !(status in AppointmentStatusEnum) : true,
      'Enter a valid status enum value.',
    );

    const statusArray: AppointmentStatusEnum[] = [];
    statusArray.push(status as AppointmentStatusEnum);

    if (status == 'PROPOSAL') {
      statusArray.push(AppointmentStatusEnum.ACCEPTED);
    } else if (status == 'CANCELLED') {
      statusArray.push(AppointmentStatusEnum.REJECTED);
    }

    const appointments = await this.prismaService.appointment.findMany({
      where: {
        userId,
        status: {
          in: statusArray,
        },
        deletedAt: null,
      },
      include: {
        providerService: {
          include: {
            serviceType: true,
          },
        },
        user: {
          select: {
            id: true,
            opk: true,
            email: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                opk: true,
                email: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
        },
        appointmentProposal: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            appointmentPet: {
              include: {
                pet: {
                  select: {
                    id: true,
                    opk: true,
                    name: true,
                    type: true,
                    weight: true,
                    weightUnit: true,
                    ageYear: true,
                    ageMonth: true,
                    dob: true,
                    gender: true,
                    profile_image: true,
                  },
                },
              },
            },
          },
        },
        review: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    throwNotFoundErrorCheck(
      appointments?.length <= 0,
      'Appointments not found.',
    );

    return {
      message: 'Appointments found successfully',
      data: appointments,
    };
  }

  async getAllAppointmentsProvider(userId: bigint, status: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(!user || !user?.provider, 'Provider not found.');

    throwBadRequestErrorCheck(
      status ? !(status in AppointmentStatusEnum) : true,
      'Enter a valid status enum value.',
    );

    const statusArray: AppointmentStatusEnum[] = [];
    statusArray.push(status as AppointmentStatusEnum);

    if (status == 'PROPOSAL') {
      statusArray.push(AppointmentStatusEnum.ACCEPTED);
    } else if (status == 'CANCELLED') {
      statusArray.push(AppointmentStatusEnum.REJECTED);
    }

    const appointments = await this.prismaService.appointment.findMany({
      where: {
        providerId: user?.provider?.id,
        status: {
          in: statusArray,
        },
        deletedAt: null,
      },
      include: {
        providerService: {
          include: {
            serviceType: true,
          },
        },
        user: {
          select: {
            id: true,
            opk: true,
            email: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                opk: true,
                email: true,
                firstName: true,
                lastName: true,
                image: true,
              },
            },
          },
        },
        appointmentProposal: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            appointmentPet: {
              include: {
                pet: {
                  select: {
                    id: true,
                    opk: true,
                    name: true,
                    type: true,
                    weight: true,
                    weightUnit: true,
                    ageYear: true,
                    ageMonth: true,
                    dob: true,
                    gender: true,
                    profile_image: true,
                  },
                },
              },
            },
          },
        },
        review: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    throwNotFoundErrorCheck(
      appointments?.length <= 0,
      'Appointments not found.',
    );

    return {
      message: 'Appointments found successfully',
      data: appointments,
    };
  }

  async getLatestAppointmentProposal(userId: bigint, opk: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
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
        user: {
          select: {
            id: true,
            opk: true,
            email: true,
            firstName: true,
            lastName: true,
            image: true,
            basicInfo: {
              include: {
                country: true,
              },
            },
            contact: true,
          },
        },
        provider: {
          include: {
            user: {
              select: {
                id: true,
                opk: true,
                email: true,
                firstName: true,
                lastName: true,
                image: true,
                basicInfo: {
                  include: {
                    country: true,
                  },
                },
                contact: true,
              },
            },
          },
        },
      },
    });

    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');

    const proposal = await this.prismaService.appointmentProposal.findFirst({
      where: {
        appointmentId: appointment?.id,
        deletedAt: null,
      },
      include: {
        appointmentPet: {
          select: {
            id: true,
            petId: true,
            pet: {
              select: {
                id: true,
                opk: true,
                name: true,
                type: true,
                weight: true,
                weightUnit: true,
                ageYear: true,
                ageMonth: true,
                dob: true,
                gender: true,
                profile_image: true,
                petBreed: {
                  include: {
                    breed: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'Proposal found successfully',
      data: {
        appointment,
        proposal,
      },
    };
  }

  async createAppointmentProposal(
    authUserId: bigint,
    createAppointmentProposalDto: CreateAppointmentProposalDto,
    req: Request,
  ) {
    // When proposal is created (TRANSACTION)
    // The an appointment is created with status as PROPOSAL
    // The timezone of the PET SITTER will have to be stored in the appointment
    // And a proposal will have to be
    // created as a child of the appointment table with the original_propsal field set to true

    const {
      providerServiceId,
      userId,
      providerId,
      appointmentserviceType,
      petsId,
      length,
      additionalLengthPrice,
      regularPrice,
      additionalCharge,
      providerExtraFee,
      totalPrice,
      dropOffStartTime,
      dropOffEndTime,
      pickUpStartTime,
      pickUpEndTime,
      proposalStartDate,
      proposalEndDate,
      proposalOtherDate,
      isRecurring,
      recurringStartDate,
      recurringSelectedDay,
      firstMessage,
      formattedMessage,
      isRecivedPhotos,
    } = createAppointmentProposalDto;

    /**
     * Data validation
     */

    throwBadRequestErrorCheck(
      authUserId != BigInt(userId),
      'Wrong user id is given.',
    );

    /**
     * DB Data validation
     */

    const [user, provider] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: {
          provider: true,
        },
      }),
      this.prismaService.provider.findFirst({
        where: {
          id: providerId,
          deletedAt: null,
        },
        include: {
          user: true,
          providerServices: {
            where: {
              id: providerServiceId,
              deletedAt: null,
            },
          },
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found');

    throwNotFoundErrorCheck(!provider, 'Provider not found.');

    throwBadRequestErrorCheck(
      BigInt(providerId) == user?.provider?.id,
      'Provider can not give proposal for own service.',
    );

    throwBadRequestErrorCheck(
      provider?.providerServices?.length <= 0,
      "Provider doesn't provide this service",
    );

    throwNotFoundErrorCheck(
      !provider?.providerServices,
      'Provider service not found.',
    );

    throwBadRequestErrorCheck(
      petsId?.length <= 0,
      'Atleast one pet should be selected',
    );

    //TODO: pets id validation if needed

    /**
     * Opk generation
     */

    let opk = this.commonService.getOpk();
    let opkGenerated = false;
    while (!opkGenerated) {
      const checkOpk = await this.prismaService.appointment.findFirst({
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

    /**
     * Invoice Number generation
     */

    let invoiceNumber = this.commonService.getInvoiceNumber();
    let invoiceNumberGenerated = false;
    while (!invoiceNumberGenerated) {
      const checkInvoiceNumber = await this.prismaService.appointment.findFirst(
        {
          where: {
            invoiceNumber,
            deletedAt: null,
          },
        },
      );
      if (checkInvoiceNumber) {
        invoiceNumber = this.commonService.getInvoiceNumber();
      } else {
        invoiceNumberGenerated = true;
      }
    }

    /**
     * Appointment Creation
     */

    const appointment = await this.prismaService.appointment.create({
      data: {
        opk,
        invoiceNumber,
        userId,
        providerId,
        providerServiceId,
        status: AppointmentStatusEnum.PROPOSAL,
        providerTimeZone: provider?.user?.timezone,
        appointmentProposal: {
          create: {
            proposedBy: appointmentProposalEnum.USER,
            original: true,
            appointmentserviceType,
            length,
            petQuantity: petsId?.length,
            additionalLengthPrice,
            regularPrice,
            additionalCharge,
            providerExtraFee,
            totalPrice,
            firstMessage,
            isRecivedPhotos,
            dropOffStartTime,
            dropOffEndTime,
            pickUpStartTime,
            pickUpEndTime,
            proposalStartDate,
            proposalEndDate,
            proposalOtherDate,
            isRecurring,
            recurringStartDate,
            recurringSelectedDay,
            meta: { formattedMessage },
          },
        },
      },
      include: {
        appointmentProposal: true,
      },
    });

    throwBadRequestErrorCheck(!appointment, 'Appointment can not create now');

    /**
     * Create appoinntment pet relation
     */
    const promises = [];

    for (let i = 0; i < petsId?.length; i++) {
      promises.push(
        await this.prismaService.appointmentPet.create({
          data: {
            petId: petsId[i],
            appointmentId: appointment?.id,
            proposalId: appointment?.appointmentProposal[0]?.id,
          },
        }),
      );
    }

    await Promise.allSettled(promises);

    /**
     * MESSAGING SERVICE: a message group will have to be created with the appointment id
     * First and formatted message will send to particular room
     */

    const messageRoom = await this.messageService.createGroup(req, 'axios', {
      sender: userId,
      receiver: providerId,
      appointmentId: appointment?.opk,
    });

    const messagePromises = [];

    messagePromises.push(
      await axios.post(
        `${this.configService.get<string>('MICROSERVICE_URL')}/v1/messages`,
        {
          sender: userId,
          group: messageRoom?.data?._id,
          content: firstMessage,
        },
      ),
    );

    messagePromises.push(
      await axios.post(
        `${this.configService.get<string>('MICROSERVICE_URL')}/v1/messages`,
        {
          sender: userId,
          group: messageRoom?.data?._id,
          content: formattedMessage,
        },
      ),
    );
    await Promise.allSettled(messagePromises);

    const updatedAppointment = await this.prismaService.appointment.update({
      where: {
        id: appointment?.id,
      },
      data: {
        lastProposalId: appointment?.appointmentProposal[0]?.id,
        messageGroupId: messageRoom?.data?._id,
      },
    });

    // TODO: Price calculation
    // TODO: Unavailability check
    return {
      message: 'Appointment proposal created successfully',
      data: {
        appointment: updatedAppointment,
        proposal: { ...appointment?.appointmentProposal[0] },
      },
    };
  }

  async updateAppointmentProposal(
    userId: bigint,
    opk: string,
    updateAppointmentProposalDto: UpdateAppointmentProposalDto,
  ) {
    /**(TRANSACTION)
     * case 1: appointment proposal is sent by NOT YET COUNTERED
     *   update existing user proposal and mark previous_proposal as ovveridden
     * case 2: appointment proposal is countered
     *   mark it as latest proposal and mark previous as countered and update lastProposedBy
     */
    // TODO: dispatch notification via notification service

    /**
     * DB Data validation
     */

    const [user, appointment] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: { id: userId, deletedAt: null },
      }),
      this.prismaService.appointment.findFirst({
        where: {
          opk,
          deletedAt: null,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found');

    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');

    /**
     * Update Proposal
     */

    const {
      proposedBy,
      appointmentserviceType,
      petsId,
      length,
      additionalLengthPrice,
      regularPrice,
      additionalCharge,
      providerExtraFee,
      totalPrice,
      dropOffStartTime,
      dropOffEndTime,
      pickUpStartTime,
      pickUpEndTime,
      proposalStartDate,
      proposalEndDate,
      proposalOtherDate,
      isRecurring,
      recurringStartDate,
      recurringSelectedDay,
      formattedMessage,
    } = updateAppointmentProposalDto;

    const proposal = await this.prismaService.appointmentProposal.create({
      data: {
        appointmentId: appointment?.id,
        proposedBy,
        countered: true,
        appointmentserviceType,
        length,
        petQuantity: petsId?.length,
        additionalLengthPrice,
        regularPrice,
        additionalCharge,
        providerExtraFee,
        totalPrice,
        dropOffStartTime,
        dropOffEndTime,
        pickUpStartTime,
        pickUpEndTime,
        proposalStartDate,
        proposalEndDate,
        proposalOtherDate,
        isRecurring,
        recurringStartDate,
        recurringSelectedDay,
        meta: { formattedMessage },
      },
    });

    throwBadRequestErrorCheck(
      !proposal,
      'Appointment proposal can not create now',
    );

    /**
     * Update appointment pet relation
     */

    const promises = [];

    for (let i = 0; i < petsId?.length; i++) {
      promises.push(
        await this.prismaService.appointmentPet.create({
          data: {
            petId: petsId[i],
            appointmentId: appointment?.id,
            proposalId: proposal?.id,
          },
        }),
      );
    }

    await Promise.allSettled(promises);

    await this.prismaService.appointment.update({
      where: {
        id: appointment?.id,
      },
      data: {
        lastProposalId: proposal?.id,
      },
    });

    return {
      message: 'Appointment proposal updated successfully',
      data: {
        appointment,
        proposal,
      },
    };
  }

  async acceptAppointmentProposal(userId: bigint, opk: string) {
    // (TRANSACTION)
    // can only be accepted by other user
    // example:
    // if sitter made the last request, then the customer can accept it
    // and vice versa
    // TODO: dispatch notification via notification service

    const [user, appointment] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
        include: {
          provider: true,
        },
      }),
      this.prismaService.appointment.findFirst({
        where: {
          opk,
          deletedAt: null,
        },
        include: {
          appointmentProposal: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');
    throwBadRequestErrorCheck(
      appointment.status === 'ACCEPTED',
      'Appointment already accepted.',
    );
    throwBadRequestErrorCheck(
      (appointment?.appointmentProposal[0]?.proposedBy === 'USER' &&
        userId == appointment?.userId) ||
        (appointment?.appointmentProposal[0]?.proposedBy === 'PROVIDER' &&
          user?.provider?.id == appointment?.providerId),
      'Proposal giver can not accept own proposal.',
    );

    const updatedAppointment = await this.prismaService.appointment.update({
      where: {
        id: appointment?.id,
      },
      data: {
        status: 'ACCEPTED',
      },
    });

    return {
      message: 'Appointment accepted successfully.',
      data: updatedAppointment,
    };
  }

  async handleProposalUpdate(/* status will be sent here, |accept|reject|edit|etc */) {
    // take status from request body and call the appropriate function
    // for example:
    // if reject -> this.rejectAppointmentProposal(params)
    return;
  }

  async cancelAppointment(opk: string) {
    try {
      const result = await this.prismaService.appointment.update({
        where: {
          opk,
        },
        data: {
          status: appointmentStatusEnum.CANCELLED,
        },
      });
      return { message: 'Appointment Canceled Successfully', data: { result } };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throwBadRequestErrorCheck(
          error.code === 'P2025',
          `No record found by ${opk}`,
        );
      }
      throw error;
    }
  }

  async appointmentMessageUploadFile(
    userId: bigint,
    opk: string,
    files: Express.Multer.File[], //: Promise<SuccessfulUploadResponse[]>
  ): Promise<SuccessfulUploadResponse[]> {
    const [user, appointment] = await this.prismaService.$transaction([
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
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');
    const uploadedFiles = await this.multerFileUploadService.uploadMultiple(
      files,
      `appointment/message/${opk}`,
    );

    return uploadedFiles;

    // return {
    //   message: 'Appointment message file upload successfullfy',
    //   data: uploadedFiles,
    // };
  }
}
