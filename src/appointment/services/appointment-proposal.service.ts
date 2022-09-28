import { Injectable } from '@nestjs/common';
import { appointmentProposalEnum } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { CommonService } from 'src/common/common.service';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderServicesService } from 'src/provider-services/provider-services.service';
import { CreateAppointmentProposalDto } from '../dto/create-appointment-proposal.dto';
import { UpdateAppointmentProposalDto } from '../dto/update-appointment-proposal.dto';
import { AppointmentStatusEnum } from '../helpers/appointment-enum';

@Injectable()
export class AppointmentProposalService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly commonService: CommonService,
    private readonly providerServicesService: ProviderServicesService,
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

    throwBadRequestErrorCheck(!user, 'Provider not found.');

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

    throwBadRequestErrorCheck(!appointment, 'Appointment not found.');

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

  async getLatestAppointmentProposal(userId: bigint, opk: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        opk,
        deletedAt: null,
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
      providerTimeZone,
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
          providerServices: {
            where: {
              id: providerServiceId,
              deletedAt: null,
            },
          },
        },
      }),
    ]);

    console.log(provider);

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
     * Appointment Creation
     */

    const appointment = await this.prismaService.appointment.create({
      data: {
        opk,
        userId,
        providerId,
        providerServiceId,
        status: AppointmentStatusEnum.PROPOSAL,
        providerTimeZone,
      },
    });

    throwBadRequestErrorCheck(!appointment, 'Appointment can not create now');

    /**
     * Proposal Creation
     */

    const proposal = await this.prismaService.appointmentProposal.create({
      data: {
        appointmentId: appointment?.id,
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
      },
    });

    throwBadRequestErrorCheck(
      !proposal,
      'Appointment proposal can not create now',
    );

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
            proposalId: proposal?.id,
          },
        }),
      );
    }

    await Promise.allSettled(promises);

    // TODO: MESSAGING SERVICE: a message group will have to be created with the appointment id
    // TODO: Price calculation
    // TODO: Unavailability check
    return {
      message: 'Appointment proposal created successfully',
      data: {
        appointment,
        proposal,
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

    return {
      message: 'Appointment proposal updated successfully',
      data: {
        appointment,
        proposal,
      },
    };
  }

  async acceptAppointmentProposal() {
    // (TRANSACTION)
    // can only be accepted by other user
    // example:
    // if sitter made the last request, then the customer can accept it
    // and vice versa
    // TODO: dispatch notification via notification service
    return;
  }

  async handleProposalUpdate(/* status will be sent here, |accept|reject|edit|etc */) {
    // take status from request body and call the appropriate function
    // for example:
    // if reject -> this.rejectAppointmentProposal(params)
    return;
  }
}
