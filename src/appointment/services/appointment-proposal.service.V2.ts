import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { EmailService } from 'src/email/email.service';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SmsService } from 'src/sms/sms.service';
import { UpdateAppointmentProposalDto } from '../dto/update-appointment-proposal.dto';
import { AppointmentProposalService } from './appointment-proposal.service';

@Injectable()
export class AppointmentProposalServiceV2 {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly appointmentProposalService: AppointmentProposalService,
  ) {
    this.logger.setContext(AppointmentProposalServiceV2.name);
  }

  async getLatestAppointmentProposalV2(userId: bigint, opk: string) {
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
              select: {
                id: true,
                city: true,
                state: true,
                zipCode: true,
                country: true,
              },
            },
            //contact: true,
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
                  select: {
                    id: true,
                    city: true,
                    state: true,
                    zipCode: true,
                    country: true,
                  },
                },
                //contact: true,
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
                    select: {
                      id: true,
                      city: true,
                      state: true,
                      zipCode: true,
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
          ? Math.round(Number(reviewStatistics?._avg?.rating?.toFixed(1)))
          : 0,
        review,
      },
    };
  }

  async updateAppointmentProposalV2(
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

    const { petsId } = updateAppointmentProposalDto;

    const [user, appointment, pets] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: { id: userId, deletedAt: null },
      }),
      this.prismaService.appointment.findFirst({
        where: {
          opk,
          deletedAt: null,
        },
        include: {
          user: {
            include: {
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
                  emailVerified: true,
                  firstName: true,
                  lastName: true,
                  zipcode: true,
                  image: true,
                  loginProvider: true,
                  timezone: true,
                  meta: true,
                  createdAt: true,
                  updatedAt: true,
                  deletedAt: true,
                  basicInfo: true,
                  contact: true,
                },
              },
            },
          },
          providerService: {
            include: {
              serviceType: true,
            },
          },
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
          name: true,
        },
      }),
    ]);

    throwNotFoundErrorCheck(!user, 'User not found');

    throwNotFoundErrorCheck(!appointment, 'Appointment not found.');

    throwBadRequestErrorCheck(
      appointment?.status !== 'PROPOSAL',
      'Apointment is not in proposal state.',
    );

    throwBadRequestErrorCheck(
      petsId?.length <= 0,
      'Atleast one pet should be selected',
    );

    /**
     * Update Proposal
     */

    const {
      proposedBy,
      appointmentserviceType,
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
    const priceCalculationDetails =
      await this.appointmentProposalService.getProposalPrice(appointment?.opk);

    const [updateAppointment] = await this.prismaService.$transaction([
      this.prismaService.appointment.update({
        where: {
          id: appointment?.id,
        },
        data: {
          lastProposalId: proposal?.id,
        },
        include: {
          user: true,
          provider: {
            include: {
              user: {
                select: {
                  id: true,
                  opk: true,
                  emailVerified: true,
                  firstName: true,
                  lastName: true,
                  zipcode: true,
                  image: true,
                  loginProvider: true,
                  timezone: true,
                  meta: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
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

    /*
     * Dispatch email notification
     * First need to formatted data for email template
     * Only to provider
     */

    const dates = [];

    for (
      let i = 0;
      i < priceCalculationDetails?.formatedDatesByZone?.length;
      i++
    ) {
      dates.push(
        new Date(
          priceCalculationDetails?.formatedDatesByZone[i]?.date,
        ).toDateString(),
      );
    }

    const petsName = pets.map((item) => {
      return item?.name;
    });

    const service_name = appointment?.providerService?.serviceType?.name;
    const sendEmail =
      proposedBy == 'USER'
        ? appointment?.provider?.user?.email
        : appointment?.user?.email;

    const emailFirstName =
      proposedBy == 'USER'
        ? appointment?.user?.firstName
        : appointment?.provider?.user?.firstName;

    try {
      //await this.emailService.appointmentCreationEmail(user?.email, 'PROPOSAL');
      await this.emailService.appointmentModifyEmail(sendEmail, {
        first_name: emailFirstName,
        appointment_opk: appointment?.opk,
        service_name,
        appointment_dates: [...new Set(dates)]?.join(', '),
        pet_names: petsName.join(', '),
        sub_total: priceCalculationDetails?.subTotal,
      });
    } catch (error) {
      console.log(error?.message);
    }

    /*
     * Dispatch sms notification
     */
    const smsUserFirstName =
      proposedBy == 'USER' ? 'You' : appointment?.provider?.user?.firstName;

    const smsProviderFirstName =
      proposedBy == 'PROVIDER' ? 'You' : appointment?.user?.firstName;
    const conversationUrl = `https://woofmeets.com/account/conversations/${appointment?.opk}`;
    try {
      if (appointment?.user?.contact?.phone) {
        await this.smsService.sendText(
          appointment?.user?.contact?.phone,
          `${smsUserFirstName} sent a modified request (${service_name}) to ${smsProviderFirstName}: ${petsName.join(
            ', ',
          )} on ${[...new Set(dates)]?.join(', ')} • ${
            length ? `${length} min` : ''
          }. Book @${conversationUrl}`,
        );
      }
      if (appointment?.provider?.user?.contact?.phone) {
        await this.smsService.sendText(
          appointment?.provider?.user?.contact?.phone,
          `${smsProviderFirstName} sent a modified request (${service_name}) to ${smsUserFirstName}: ${petsName.join(
            ', ',
          )} on ${[...new Set(dates)]?.join(', ')} • ${
            length ? `${length} min` : ''
          }. Book @${conversationUrl}`,
        );
      }
    } catch (error) {
      console.log(error?.message);
    }

    return {
      message: 'Appointment proposal updated successfully',
      data: {
        updateAppointment,
        proposal,
      },
    };
  }
}
