import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  appointmentProposalEnum,
  appointmentStatusEnum,
  petTypeEnum,
  Prisma,
  subscriptionTypeEnum,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import axios from 'axios';
import { differenceInDays } from 'date-fns';
import { toDate, utcToZonedTime } from 'date-fns-tz';
import { PinoLogger } from 'nestjs-pino';
import { CommonService } from 'src/common/common.service';
import { EmailService } from 'src/email/email.service';
import { SuccessfulUploadResponse } from 'src/file/dto/upload-flie.dto';
import { MulterFileUploadService } from 'src/file/multer-file-upload-service';
import {
  DaysOfWeek,
  extractDay,
  generateDatesFromAndTo,
  generateDays,
} from 'src/global';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { MessagingProxyService } from 'src/messaging/messaging.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { ServiceRatesService } from 'src/service-rates/service-rates.service';
import { StripeDispatcherService } from 'src/stripe/stripe.dispatcher.service';
import { latlongDistanceCalculator } from 'src/utils/tools';
import { CancelAppointmentDto } from '../dto/cancel-appointment.dto';
import { CreateAppointmentProposalDto } from '../dto/create-appointment-proposal.dto';
import { PetsCheckDto } from '../dto/pet-check.dto';
import { UpdateAppointmentProposalDto } from '../dto/update-appointment-proposal.dto';
import {
  AppointmentProposalEnum,
  AppointmentStatusEnum,
} from '../helpers/appointment-enum';
import {
  checkIfAnyDateHoliday,
  generateDatesFromProposalVisits,
  TimingType,
  VisitType,
} from '../helpers/appointment-visits';

@Injectable()
export class AppointmentProposalService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly commonService: CommonService,
    private readonly secretService: SecretService,
    private readonly messageService: MessagingProxyService,
    private readonly multerFileUploadService: MulterFileUploadService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
    private readonly serviceRatesService: ServiceRatesService,
    private readonly stripeService: StripeDispatcherService,
    private readonly emailService: EmailService,
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
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(!user, 'Provider not found.');
    throwNotFoundErrorCheck(!user?.provider, 'Provider not found.');

    const providerServices = await this.prismaService.providerServices.findMany(
      {
        where: {
          providerId: user.provider.id,
          isApproved: true,
          deletedAt: null,
        },
        include: {
          serviceType: {
            select: {
              id: true,
              name: true,
              slug: true,
              displayName: true,
              description: true,
              icon: true,
              sequence: true,
              appRequired: true,
            },
          },
          ServiceHasRates: true,
          AvailableDay: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    );

    throwNotFoundErrorCheck(
      !providerServices.length,
      'Provider service list not found',
    );

    const filterProviderServices = providerServices.filter((item) => {
      if (item?.AvailableDay?.length > 0 && item?.ServiceHasRates?.length > 0) {
        return item;
      }
    });

    return {
      message: 'Provider services found successfully',
      data: filterProviderServices,
    };
  }

  async getProviderServiceAdditionalRates(opk: string) {
    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        opk,
        deletedAt: null,
      },
    });

    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');

    // TODO: @ankur datta | filter incomplete data

    const providerServiceDetails =
      await this.prismaService.providerServices.findFirst({
        where: {
          id: appointment?.providerServiceId,
          deletedAt: null,
        },
        include: {
          ServiceHasRates: {
            where: {
              amount: {
                not: null,
              },
            },
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
    } else if (status == 'REJECTED') {
      statusArray.push(AppointmentStatusEnum.CANCELLED);
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
      orderBy: {
        createdAt: 'desc',
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
    } else if (status == 'REJECTED') {
      statusArray.push(AppointmentStatusEnum.CANCELLED);
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
      orderBy: {
        createdAt: 'desc',
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
        review: true,
        billing: true,
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
            zoomInfo: true,
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

    throwNotFoundErrorCheck(
      appointment?.userId != userId &&
        appointment?.providerId != user?.provider?.id,
      'Provider not found.',
    );

    const reviewedForId =
      appointment?.userId == userId
        ? appointment?.provider?.user?.id
        : appointment?.userId;

    const reviewStatistics = await this.prismaService.review.aggregate({
      where: {
        reviewedForId,
        deletedAt: null,
      },
      _avg: {
        rating: true,
      },
    });

    const review =
      appointment?.userId != userId
        ? await this.prismaService.review.findMany({
            where: {
              reviewedForId: appointment?.userId,
              deletedAt: null,
            },
            select: {
              id: true,
              reviewedById: true,
              reviewedForId: true,
              rating: true,
              comment: true,
              reviewedByIdUser: {
                select: {
                  id: true,
                  opk: true,
                  email: true,
                  emailVerified: true,
                  firstName: true,
                  lastName: true,
                  zipcode: true,
                  image: true,
                  timezone: true,
                  meta: true,
                  basicInfo: {
                    include: {
                      country: true,
                    },
                  },
                },
              },
            },
          })
        : null;

    return {
      message: 'Proposal found successfully',
      data: {
        appointment,
        proposal,
        zoomAuthorized:
          appointment?.provider?.zoomInfo?.refreshToken?.length > 0
            ? true
            : false,
        rating: reviewStatistics?._avg?.rating
          ? Number(reviewStatistics?._avg?.rating?.toFixed(1))
          : 0,
        review,
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
      proposalVisits,
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
            include: {
              ServiceHasRates: true,
            },
          },
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found');

    throwNotFoundErrorCheck(!provider, 'Provider not found.');

    throwNotFoundErrorCheck(
      !provider?.user?.timezone,
      'Provider needs to update timezone.',
    );

    throwBadRequestErrorCheck(
      provider?.providerServices?.[0]?.ServiceHasRates?.length === 0,
      "Provider doesn't has all the rates of this service so can not book appointment now.",
    );

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
        isRecurring: isRecurring ?? false,
        lastStatusChangedBy: AppointmentProposalEnum?.USER,
        status: AppointmentStatusEnum.PROPOSAL,
        providerTimeZone: provider?.user?.timezone,
        appointmentProposal: {
          create: {
            proposedBy: appointmentProposalEnum.USER,
            original: true,
            appointmentserviceType,
            length,
            petsIds: petsId,
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
            proposalOtherDate: proposalOtherDate?.map((item) => ({
              date: item,
            })),
            proposalVisits,
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

    const priceCalculationDetails = await this.getProposalPrice(
      appointment?.opk,
    );

    const [updatedAppointment] = await this.prismaService.$transaction([
      this.prismaService.appointment.update({
        where: {
          id: appointment?.id,
        },
        data: {
          lastProposalId: appointment?.appointmentProposal[0]?.id,
          messageGroupId: messageRoom?.data?._id,
        },
      }),
      this.prismaService.appointmentProposal.update({
        where: {
          id: appointment?.appointmentProposal[0]?.id,
        },
        data: {
          priceCalculationDetails: Object(priceCalculationDetails),
        },
      }),
    ]);

    /*
     * Dispatch email notification
     */
    await this.emailService.appointmentCreationEmail(user?.email, 'PROPOSAL');
    await this.emailService.appointmentCreationEmail(
      provider?.user?.email,
      'PROPOSAL',
    );

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

    throwBadRequestErrorCheck(
      appointment?.status !== 'PROPOSAL',
      'Apointment is not in proposal state.',
    );

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
      proposalVisits,
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
        petsIds: petsId,
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
        proposalOtherDate: proposalOtherDate?.map((item) => ({
          date: item,
        })),
        proposalVisits,
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
    const priceCalculationDetails = await this.getProposalPrice(
      appointment?.opk,
    );

    await this.prismaService.$transaction([
      this.prismaService.appointment.update({
        where: {
          id: appointment?.id,
        },
        data: {
          lastProposalId: proposal?.id,
        },
      }),
      this.prismaService.appointmentProposal.update({
        where: {
          id: proposal?.id,
        },
        data: {
          priceCalculationDetails: JSON.parse(
            JSON.stringify(priceCalculationDetails),
          ),
        },
      }),
    ]);

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
          user: true,
          provider: {
            include: {
              user: true,
            },
          },
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

    /*
      Billing Table Generation
      Appointment Dates Generation
    */
    const priceCalculation = await this.getProposalPrice(appointment?.opk);

    const [billing, updatedAppointment] = await this.prismaService.$transaction(
      [
        this.prismaService.billing.create({
          data: {
            appointmentId: appointment?.id,
            totalDayCount: priceCalculation?.formatedDatesByZone?.length,
            subtotal: Number(priceCalculation?.subTotal),
            serviceCharge: Number(
              (
                (Number(priceCalculation?.subTotal) *
                  priceCalculation?.serviceChargeInParcentage) /
                100
              ).toFixed(2),
            ),
            serviceChargePercentage:
              priceCalculation?.serviceChargeInParcentage,
            total: Number(priceCalculation?.total),
          },
        }),
        this.prismaService.appointment.update({
          where: {
            id: appointment?.id,
          },
          data: {
            status: 'ACCEPTED',
            lastStatusChangedBy:
              appointment?.appointmentProposal[0]?.proposedBy === 'USER'
                ? appointmentProposalEnum.PROVIDER
                : appointmentProposalEnum.USER,
          },
        }),
      ],
    );

    /*
     * Dispatch email notification
     */
    await this.emailService.appointmentAcceptEmail(
      appointment?.user?.email,
      'ACCEPTED',
    );
    await this.emailService.appointmentAcceptEmail(
      appointment?.provider?.user?.email,
      'ACCEPTED',
    );

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

  async cancelAppointment(
    userId: bigint,
    opk: string,
    cancelAppointmentDto: CancelAppointmentDto,
  ) {
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
          user: true,
          appointmentProposal: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          billing: {
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              appointmentBillingPayments: {
                where: {
                  status: 'succeeded',
                  deletedAt: null,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
              appointmentBillingTransactions: {
                where: {
                  releaseStatus: false,
                  deletedAt: null,
                },
                orderBy: {
                  createdAt: 'desc',
                },
              },
            },
          },
          provider: {
            select: {
              user: true,
              cancellationPolicy: true,
            },
          },
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');
    throwBadRequestErrorCheck(
      appointment.status !== 'PAID',
      'Only paid appointment can be cancelled.',
    );

    let lastStatusChangedBy: appointmentProposalEnum;
    if (user?.id == appointment?.userId) {
      lastStatusChangedBy = appointmentProposalEnum?.USER;
    } else {
      throwBadRequestErrorCheck(
        user?.provider?.id !== appointment?.providerId,
        'Provider not found.',
      );
      lastStatusChangedBy = appointmentProposalEnum?.PROVIDER;
    }

    const { cancelReason } = cancelAppointmentDto;

    /*
     * Get price of appointment
     * Convert server to provider timezone
     * Calculate appointment remaining days
     * Based on remaining days check cancellation policy and calculate price on calcellation policy
     * if provider cancelled appointment, then check how many visits remaining and calculate refund price
     */
    const priceCalculationDetails = await this.getProposalPrice(
      appointment?.opk,
    );

    const serverProviderZoneTime = utcToZonedTime(
      toDate(new Date(), {
        timeZone: appointment?.providerTimeZone,
      }),
      appointment?.providerTimeZone,
    );

    const diffDays = differenceInDays(
      new Date(priceCalculationDetails?.formatedDatesByZone[0]?.date),
      serverProviderZoneTime,
    );

    let fullRefund = false;
    let cancellationPolicyId;
    let userRefundAmount = 0;

    const appointmentDates = await this.prismaService.appointmentDates.findMany(
      {
        where: {
          date: {
            gte: serverProviderZoneTime,
          },
          appointmentId: appointment?.id,
          deletedAt: null,
        },
      },
    );

    const providerRemainingAppointmentVisits = appointmentDates?.length;

    const appoinntmentDatesId = appointmentDates.map((item) => {
      return item?.id;
    });

    if (lastStatusChangedBy === 'USER' && diffDays >= 0) {
      if (appointment?.provider?.cancellationPolicy?.slug == 'seven_day') {
        cancellationPolicyId = appointment?.provider?.cancellationPolicy?.id;
        fullRefund = diffDays >= 7 ? true : false;
      } else if (
        appointment?.provider?.cancellationPolicy?.slug == 'three_day'
      ) {
        cancellationPolicyId = appointment?.provider?.cancellationPolicy?.id;
        fullRefund = diffDays >= 3 ? true : false;
      } else if (appointment?.provider?.cancellationPolicy?.slug == 'one_day') {
        cancellationPolicyId = appointment?.provider?.cancellationPolicy?.id;
        fullRefund = diffDays >= 1 ? true : false;
      } else if (
        appointment?.provider?.cancellationPolicy?.slug == 'same_day'
      ) {
        cancellationPolicyId = appointment?.provider?.cancellationPolicy?.id;
        fullRefund = diffDays >= 0 ? true : false;
      }

      userRefundAmount = fullRefund
        ? appointment?.billing[0]?.subtotal
        : Number(
            (
              appointment?.billing[0]?.subtotal *
              (this.secretService.getAppointmentCreds().refundPercentage / 100)
            ).toFixed(2),
          );
    } else {
      userRefundAmount = Number(
        (
          providerRemainingAppointmentVisits *
          (appointment?.billing[0]?.subtotal /
            appointment?.billing[0]?.totalDayCount)
        ).toFixed(2),
      );
    }

    const refundPay = await this.stripeService.refundDispatcher({
      amountInDollars: userRefundAmount,
      chargeId:
        appointment?.billing?.[0]?.appointmentBillingPayments?.[0]?.chargeId,
      cancellation_reason: 'requested_by_customer',
      metadata: {
        type: 'appointment_refund',
        userId: user?.id.toString(),
        appointmentId: appointment?.id.toString(),
      },
    });

    if (refundPay?.success) {
      const [updatedAppointment] = await this.prismaService.$transaction([
        this.prismaService.appointment.update({
          where: {
            id: appointment?.id,
          },
          data: {
            status: 'CANCELLED',
            lastStatusChangedBy,
            cancelReason,
            cancelAppointment: {
              create: {
                cancellationPolicyId,
                cancelledBy: lastStatusChangedBy,
                paidTo: 'USER',
                dayRemainingBeforeAppointment: diffDays,
                userRefundAmount,
                refundStatus: 'REFUND',
                userRefundPercentage:
                  lastStatusChangedBy === 'USER' && diffDays >= 0
                    ? fullRefund
                      ? 100
                      : this.secretService.getAppointmentCreds()
                          .refundPercentage
                    : null,
                providerRemainingAppointmentVisits,
                meta: {
                  stripeResult: Object(refundPay),
                },
              },
            },
          },
          include: {
            cancelAppointment: true,
          },
        }),
        this.prismaService.appointmentDates.updateMany({
          where: {
            id: {
              in: appoinntmentDatesId,
            },
          },
          data: {
            paymentStatus: 'REFUND',
          },
        }),
      ]);

      if (!fullRefund) {
        await this.prismaService.appointmentBillingTransactions.update({
          where: {
            id: appointment?.billing[0]?.appointmentBillingTransactions[0]?.id,
          },
          data: {
            providerAmount: Number(
              (
                appointment?.billing[0]?.appointmentBillingTransactions[0]
                  ?.providerAmount - userRefundAmount
              ).toFixed(2),
            ),
            meta: Object({
              type: 'appointment_refund',
              appointmentId: appointment?.id,
              cancelledBy: lastStatusChangedBy,
              date: new Date(),
            }),
          },
        });
      } else {
        await this.prismaService.appointmentBillingTransactions.update({
          where: {
            id: appointment?.billing[0]?.appointmentBillingTransactions[0]?.id,
          },
          data: {
            deletedAt: new Date(),
            meta: Object({
              type: 'appointment_refund',
              appointmentId: appointment?.id,
              cancelledBy: lastStatusChangedBy,
              date: new Date(),
            }),
          },
        });
      }

      /*
       * Appointment refund deitals update in proposal service
       */

      const providerAmount = Math.max(
        priceCalculationDetails?.providerFee?.providerTotal - userRefundAmount,
        0,
      );
      await this.prismaService.appointmentProposal.update({
        where: {
          id: appointment?.appointmentProposal[0]?.id,
        },
        data: {
          refundDetails: Object({
            cancelAppointmentDetails: updatedAppointment?.cancelAppointment,
            userAmount: userRefundAmount,
            providerAmount,
            refundType: providerAmount > 0 ? 'Partial Refund' : 'Full Refund',
            providerFee: priceCalculationDetails?.providerFee,
          }),
        },
      });

      /*
       * Dispatch email notification
       */
      this.emailService.appointmentCancelEmail(
        appointment?.user?.email,
        'CANCELLED',
      );
      this.emailService.appointmentCancelEmail(
        appointment?.provider?.user?.email,
        'CANCELLED',
      );

      return {
        message: 'Appointment cancelled successfully.',
        data: {
          ...updatedAppointment,
          userAmount: userRefundAmount,
          providerAmount: Math.max(
            priceCalculationDetails?.providerFee?.providerTotal -
              userRefundAmount,
            0,
          ),
          providerFee: priceCalculationDetails?.providerFee,
        },
      };
    } else {
      await this.prismaService.cancelAppointment.create({
        data: {
          appointmentId: appointment?.id,
          cancellationPolicyId,
          cancelledBy: lastStatusChangedBy,
          paidTo: 'USER',
          dayRemainingBeforeAppointment: diffDays,
          userRefundAmount,
          refundStatus: 'REFUND_FAILED',
          userRefundPercentage:
            lastStatusChangedBy === 'USER' &&
            !appointment?.appointmentProposal[0]?.isRecurring
              ? this.secretService.getAppointmentCreds().refundPercentage
              : null,
          providerRemainingAppointmentVisits,
          meta: {
            stripeResult: Object(refundPay),
          },
        },
      });
      throwBadRequestErrorCheck(
        true,
        'Appointment can not cancelled now. Please try again after sometime or contact support team.',
      );
    }
  }

  async rejectAppointmentProposal(userId: bigint, opk: string) {
    try {
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
        }),
      ]);

      throwNotFoundErrorCheck(!user, 'User not found.');
      throwNotFoundErrorCheck(!appointment, 'Appointment not found.');
      throwBadRequestErrorCheck(
        appointment?.status !== 'PROPOSAL' &&
          appointment?.status !== 'ACCEPTED',
        'Apointment is not in rejected state',
      );

      let lastStatusChangedBy: appointmentProposalEnum;
      if (user?.id == appointment?.userId) {
        lastStatusChangedBy = appointmentProposalEnum?.USER;
      } else {
        throwBadRequestErrorCheck(
          user?.provider?.id !== appointment?.providerId,
          'Provider not found.',
        );
        lastStatusChangedBy = appointmentProposalEnum?.PROVIDER;
      }

      const result = await this.prismaService.appointment.update({
        where: {
          opk,
        },
        data: {
          status: appointmentStatusEnum.REJECTED,
          lastStatusChangedBy,
        },
      });
      return {
        message: 'Appointment rejected successfully',
        data: { result },
      };
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

  async getProposalPrice(opk: string) {
    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        opk,
      },
      include: {
        providerService: {
          select: {
            serviceType: {
              select: {
                id: true,
                slug: true,
              },
            },
          },
        },
        appointmentProposal: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        provider: {
          select: {
            subscriptionType: true,
          },
        },
      },
    });

    const proposalDates =
      appointment.appointmentProposal?.[0].proposalOtherDate?.map((item) => {
        return new Date((item as { date: string }).date);
      });
    const providerService = appointment.providerService.serviceType.slug;
    const timing = {
      dropOffStartTime: appointment.appointmentProposal?.[0].dropOffStartTime,
      dropOffEndTime: appointment.appointmentProposal?.[0].dropOffEndTime,
      pickUpStartTime: appointment.appointmentProposal?.[0].pickUpStartTime,
      pickUpEndTime: appointment.appointmentProposal?.[0].pickUpEndTime,
    };

    if (providerService === 'doggy-day-care') {
      return this.calculateDayCarePrice(
        appointment.providerServiceId,
        appointment.appointmentProposal?.[0].petsIds,
        proposalDates,
        appointment.providerTimeZone,
        timing,
        appointment.appointmentProposal?.[0].isRecurring,
        appointment.appointmentProposal?.[0].recurringStartDate,
        appointment.appointmentProposal?.[0].recurringSelectedDay,
      );
    } else if (
      providerService === 'house-sitting' ||
      providerService === 'boarding'
    ) {
      return this.calculateBoardingAndHouseSittingPrice(
        appointment.providerServiceId,
        appointment.appointmentProposal?.[0].petsIds,
        appointment.appointmentProposal?.[0].proposalStartDate,
        appointment.appointmentProposal?.[0].proposalEndDate,
        appointment.providerTimeZone,
        timing,
      );
    } else if (
      providerService === 'drop-in-visits' ||
      providerService === 'dog-walking'
    ) {
      const isRecurring = appointment.appointmentProposal?.[0].isRecurring;
      const proposalVisits =
        appointment.appointmentProposal?.[0].proposalVisits;
      const formattedProposalVisits: VisitType[] = [];
      for (let i = 0; i < proposalVisits.length; i++) {
        const proposalVisit = proposalVisits[i] as Prisma.JsonObject;
        formattedProposalVisits.push({
          ...(isRecurring
            ? { day: proposalVisit?.name as string }
            : { date: proposalVisit?.date as string }),
          visits: (
            proposalVisit?.visits as { id: number; time: string }[]
          )?.map((visit) => visit?.time),
        });
      }
      return this.calculateVisitWalkPrice(
        appointment.providerServiceId,
        appointment.appointmentProposal?.[0].petsIds,
        isRecurring,
        appointment.appointmentProposal?.[0].recurringStartDate,
        formattedProposalVisits,
        appointment.providerTimeZone,
        BigInt(appointment.appointmentProposal?.[0].length),
      );
    } else {
      // throwBadRequestErrorCheck(true, 'Invalid Provider Service');
    }
    return {
      petsRates: null,
      ratesByServiceType: null,
      formatedDatesByZone: null,
      subTotal: null,
      sixtyMinuteRate: null,
      timing: null,
      serviceChargeInParcentage: null,
      total: null,
      providerFee: null,
    };
  }

  async calculateDayCarePrice(
    serviceId: bigint,
    petIds: bigint[],
    dates: Date[],
    timeZone: string,
    timing: TimingType,
    isRecurring: boolean,
    recurringStartDate: Date,
    recurringSelectedDays: string[],
  ) {
    let generatedDates: Date[] = [];
    if (isRecurring) {
      throwBadRequestErrorCheck(
        recurringSelectedDays.length === 0,
        'Invalid Request! recurringSelectedDays required if isRecurring true',
      );
      const recurringDays = recurringSelectedDays.map(
        (item) => item[0].toUpperCase() + item.slice(1),
      );

      const currentDay = extractDay(recurringStartDate, timeZone);
      const isSelectedDay = recurringDays?.includes(currentDay);
      throwBadRequestErrorCheck(
        isSelectedDay,
        `Invalid Request! Day of recurringStartDate ${currentDay} must be included recurringSelecteDays`,
      );

      generatedDates = generateDays(
        {
          offset: recurringStartDate,
          skipOffset: false,
          timezone: timeZone,
        },
        recurringDays as DaysOfWeek[],
      );
    } else {
      throwBadRequestErrorCheck(
        dates?.length === 0,
        'Invalid Request! dates are required if isRecurring is false',
      );
    }
    const datesToPass = isRecurring ? generatedDates : dates;
    return this.calculateProposalPrice(
      serviceId,
      petIds,
      datesToPass,
      timeZone,
      false,
      timing,
    );
  }

  async calculateBoardingAndHouseSittingPrice(
    serviceId: bigint,
    petIds: bigint[],
    proposalStartDate: string,
    proposalEndDate: string,
    timeZone: string,
    timing: TimingType,
  ) {
    const dates: Date[] = generateDatesFromAndTo(
      new Date(proposalStartDate),
      new Date(proposalEndDate),
      [],
    );
    return this.calculateProposalPrice(
      serviceId,
      petIds,
      dates,
      timeZone,
      false,
      timing,
    );
  }

  async calculateVisitWalkPrice(
    serviceId: bigint,
    petIds: bigint[],
    isRecurring: boolean,
    recurringStartDate: Date,
    proposalVisits: VisitType[],
    timeZone: string,
    length: bigint,
    timing?: TimingType,
  ) {
    throwBadRequestErrorCheck(
      proposalVisits?.length === 0,
      "Invalid Request! proposalVisits shouldn't be empty",
    );

    if (isRecurring) {
      const recurringDays: string[] = [];
      for (let i = 0; i < proposalVisits?.length; i++) {
        throwBadRequestErrorCheck(
          proposalVisits[i]?.day == '' ||
            proposalVisits[i]?.visits?.length === 0,
          "Invalid Request! each item of proposalVisit's day and visits must be valid",
        );
        recurringDays.push(proposalVisits[i]?.day);
      }
      const currentDay = extractDay(recurringStartDate, timeZone);
      const isSelectedDay = recurringDays?.includes(currentDay.toLowerCase());
      throwBadRequestErrorCheck(
        isSelectedDay,
        `Invalid Request! Day of recurringStartDate ${currentDay} must be included recurringSelecteDays`,
      );
    } else {
      for (let i = 0; i < proposalVisits?.length; i++) {
        throwBadRequestErrorCheck(
          proposalVisits?.[i]?.date == '' ||
            proposalVisits?.[i]?.visits?.length === 0,
          "Invalid Request! each item of proposalVisit's date and visits must be valid",
        );
      }
    }

    const dates = generateDatesFromProposalVisits(
      recurringStartDate,
      proposalVisits,
      timeZone,
      isRecurring,
    );
    const isSixtyMinuteRate = length >= 60;
    return this.calculateProposalPrice(
      serviceId,
      petIds,
      dates,
      timeZone,
      isSixtyMinuteRate,
      timing,
    );
  }

  // calculate price for Day Care, Boarding and House Sitting
  async calculateProposalPrice(
    serviceId: bigint,
    petIds: bigint[],
    dates: Date[],
    timeZone: string,
    isSixtyMinuteRate: boolean,
    timing?: TimingType,
  ) {
    const rates = await this.serviceRatesService.findOne(serviceId);
    const ratesByServiceType = {};
    rates.data.forEach((rate) => {
      ratesByServiceType[rate.serviceTypeRate.serviceRateType.slug] = {
        name: rate.serviceTypeRate.serviceRateType.name,
        amount: rate.amount,
      };
    });
    const subscriptionType = rates.data[0].service.provider.subscriptionType;
    const pets = await this.prismaService.pet.findMany({
      where: {
        id: {
          in: petIds,
        },
      },
    });

    const holidays = await this.prismaService.holidays.findMany({});

    const { isThereAnyHoliday, formattedDatesWithHolidays } =
      checkIfAnyDateHoliday(dates, holidays, timeZone);

    const petsRates = [];
    const numberOfNights = dates.length;
    let subTotal = 0.0;
    if (isThereAnyHoliday) {
      pets.forEach((pet) => {
        petsRates.push({
          id: pet.id,
          name: pet.name,
          rate: ratesByServiceType['holiday-rate'],
          count: numberOfNights,
          isHoliday: true,
          isAdditional: false,
        });
        subTotal += ratesByServiceType['holiday-rate'].amount * numberOfNights;
      });
    } else {
      let dogCountForBaseRate = 0;
      let catCountForBaseRate = 0;
      pets.forEach((pet) => {
        let isAdditional = false;
        let rate: { name: string; amount: number } = { name: '', amount: 0 };
        if (pet.type === petTypeEnum.DOG && dogCountForBaseRate >= 1) {
          rate = ratesByServiceType['additional-dog'];
          isAdditional = true;
          dogCountForBaseRate++;
        } else if (pet.type === petTypeEnum.CAT && catCountForBaseRate >= 1) {
          rate = ratesByServiceType['additional-cat'];
          isAdditional = true;
          catCountForBaseRate++;
        }

        if (
          !isAdditional &&
          pet.type === petTypeEnum.DOG &&
          pet.ageYear === 0 &&
          pet.ageMonth < 12
        ) {
          rate = ratesByServiceType['puppy-rate'];
          dogCountForBaseRate++;
        } else if (!isAdditional) {
          rate =
            pet?.type === petTypeEnum.DOG
              ? ratesByServiceType['base-rate']
              : ratesByServiceType['cat-care'];
          dogCountForBaseRate += pet.type === petTypeEnum.DOG ? 1 : 0;
          catCountForBaseRate += pet.type === petTypeEnum.CAT ? 1 : 0;
        }

        petsRates.push({
          id: pet.id,
          name: pet.name,
          rate,
          count: numberOfNights,
          isHoliday: false,
          isAdditional,
        });

        subTotal += rate.amount * numberOfNights;
      });
    }

    if (isSixtyMinuteRate) {
      subTotal += numberOfNights * ratesByServiceType['sixty-minutes'].amount;
    }

    const providerFee = {
      subscriptionType,
      subscriptionFee: 0,
      subscriptionFeeInParcentage: 0,
      providerTotal: 0,
    };
    const appointmentCreds = this.secretService.getAppointmentCreds();
    switch (subscriptionType) {
      case subscriptionTypeEnum.BASIC:
        providerFee.subscriptionFeeInParcentage =
          appointmentCreds.providerChargeParcentageBasic;
        break;
      case subscriptionTypeEnum.GOLD:
        providerFee.subscriptionFeeInParcentage =
          appointmentCreds.providerChargeParcentageGold;
        break;
      case subscriptionTypeEnum.PLATINUM:
        providerFee.subscriptionFeeInParcentage =
          appointmentCreds.providerChargeParcentagePlatinum;
        break;
    }

    const providerSubscriptionFee =
      providerFee.subscriptionFeeInParcentage > 0
        ? providerFee.subscriptionFeeInParcentage / 100
        : 0;
    providerFee.subscriptionFee = subTotal * providerSubscriptionFee;
    providerFee.providerTotal = subTotal - providerFee.subscriptionFee;

    const serviceChargeInParcentage = this.configService.get<number>(
      'APPOINTMENT_SERVICE_CHARGE_PERCENTAGE',
    );
    const customerCharge =
      serviceChargeInParcentage > 0 ? serviceChargeInParcentage / 100 : 0;
    const result = {
      petsRates,
      ...(isSixtyMinuteRate && {
        sixtyMinutesRate: {
          count: numberOfNights,
          rate: ratesByServiceType['sixty-minutes'],
        },
      }),
      ratesByServiceType,
      ...(timing && { timing }),
      formatedDatesByZone: formattedDatesWithHolidays,
      subTotal: subTotal.toFixed(2),
      providerFee,
      serviceChargeInParcentage,
      total: (subTotal * (1 + customerCharge)).toFixed(2),
    };

    return result;
  }

  async completeAppointment(userId: bigint, opk: string) {
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
        include: {
          provider: {
            include: {
              user: true,
            },
          },
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found.');
    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');
    throwBadRequestErrorCheck(
      appointment?.status === 'COMPLETED',
      'Appointment is already completed.',
    );

    throwBadRequestErrorCheck(
      appointment?.status !== 'PROPOSAL' && appointment?.status !== 'PAID',
      'Apointment is not in completed state',
    );

    throwBadRequestErrorCheck(
      user?.id != appointment?.userId,
      'Only user can complete the appointment.',
    );

    const lastDate = await this.prismaService.appointmentDates.findFirst({
      where: {
        appointmentId: appointment?.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const serverProviderZoneTime = utcToZonedTime(
      toDate(new Date(), {
        timeZone: appointment?.providerTimeZone,
      }),
      appointment?.providerTimeZone,
    );

    // this condition is now block for frontend implementation & test purpose
    if (!this.secretService.getTwilioCreds().allowTest) {
      throwBadRequestErrorCheck(
        lastDate?.date > serverProviderZoneTime,
        'Appointment not finished yet',
      );
    }

    const result = await this.prismaService.appointment.update({
      where: {
        opk,
      },
      data: {
        status: appointmentStatusEnum.COMPLETED,
        endOfLife: new Date(),
        lastStatusChangedBy: 'USER',
      },
    });

    /*
     * Dispatch email notification
     */
    await this.emailService.appointmentCompleteEmail(
      appointment?.provider?.user?.email,
      'COMPLETED',
    );

    return {
      message: 'Appointment completed successfully',
      data: result,
    };
  }

  async recurringAppointmentBilling(userId: bigint, opk: string) {
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
    throwNotFoundErrorCheck(
      !appointment?.appointmentProposal[0]?.isRecurring,
      'Appointment is not recurring.',
    );
    throwBadRequestErrorCheck(
      user?.id != appointment?.userId || appointment?.status !== 'PAID',
      'Only user can extend the recurring appointment which must be paid.',
    );

    const priceCalculation = await this.getProposalPrice(appointment?.opk);

    const billing = await this.prismaService.billing.create({
      data: {
        appointmentId: appointment?.id,
        totalDayCount: priceCalculation?.formatedDatesByZone?.length,
        subtotal: Number(priceCalculation?.subTotal),
        serviceCharge: Number(
          (
            (Number(priceCalculation?.subTotal) *
              priceCalculation?.serviceChargeInParcentage) /
            100
          ).toFixed(2),
        ),
        serviceChargePercentage: priceCalculation?.serviceChargeInParcentage,
        total: Number(priceCalculation?.total),
      },
    });

    return {
      message: 'Recurring appointment billing generated successfully',
      data: {
        billing,
        priceCalculation,
      },
    };
  }
}
