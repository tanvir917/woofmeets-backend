import { mapToObject } from './../global/utils/map.tools';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  USER_ONBOARDING_STAGES,
  SubFieldProgress,
  PROFILE_SETUP_SUBLIST,
  SAFETY_QUIZ_SUBLIST,
  SERVICE_SELECTION_SUBLIST,
  SERVICE_SETUP_SUBLIST,
  SUBSCRIPTION_SUBLIST,
} from './dto/user-onboarding-progress.dto';

@Injectable()
export class UserOnboardingProgressService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserOnboardingProgressService.name);
  }

  async getUserOnboardingProgress(userId: bigint) {
    const statusMap = new Map<USER_ONBOARDING_STAGES, boolean[]>();

    statusMap.set(USER_ONBOARDING_STAGES.SERVICE_SELECTION, []);
    statusMap.set(USER_ONBOARDING_STAGES.SERVICE_SETUP, []);
    statusMap.set(USER_ONBOARDING_STAGES.PROFILE_SETUP, []);
    statusMap.set(USER_ONBOARDING_STAGES.SAFETY_QUIZ, []);
    statusMap.set(USER_ONBOARDING_STAGES.SUBSCRIPTION, []);

    const addCompletionValue = (key: USER_ONBOARDING_STAGES) => {
      const subFieldMap = new Map<string, SubFieldProgress>();

      return (
        isComplete: boolean,
        subFieldKey: string,
        incompleteReason?: string,
      ): Map<string, SubFieldProgress> => {
        statusMap.get(key)?.push(isComplete);

        subFieldMap.set(subFieldKey, {
          complete: isComplete,
          message: incompleteReason,
        });

        return subFieldMap;
      };
    };

    const now = new Date();

    const [services, data] = await this.prismaService.$transaction([
      this.prismaService.serviceType.findMany({
        select: {
          id: true,
          slug: true,
        },
        where: {
          deletedAt: null,
        },
      }),
      this.prismaService.user.findFirst({
        where: { id: userId },
        select: {
          // 3. Start(group) create your profile
          basicInfo: {
            select: {
              detailsSubmitted: true,
            },
          },
          contact: {
            select: {
              phone: true,
              verifiedAt: true,
            },
          },
          emergencyContact: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
          Gallery: {
            select: {
              id: true,
            },
            where: {
              deletedAt: null,
              imageSrc: {
                not: undefined,
              },
            },
          },
          pet: {
            select: {
              id: true,
            },
            where: {
              deletedAt: null,
            },
          },
          userSubscriptions: {
            select: {
              id: true,
            },
            where: {
              currentPeriodStart: {
                lte: now,
              },
              currentPeriodEnd: {
                gt: now,
              },
              status: 'active',
              deletedAt: null,
            },
          },
          // 3. End(group) create your profile

          provider: {
            select: {
              // 3. create your profile -> Your Pets
              // if yes and have_pets then true
              // if no then true
              havePets: true,
              // 3. create your profile
              providerDetails: {
                select: {
                  id: true,
                  yearsOfExperience: true,
                },
              },

              // 1. select services
              providerServices: {
                select: {
                  serviceType: {
                    select: {
                      name: true,
                      slug: true,
                      id: true,
                    },
                  },
                  // 2. Service Setup
                  AvailableDay: {
                    select: {
                      id: true,
                    },
                    where: {
                      deletedAt: null,
                    },
                  },
                  // 2. Setup Services -> rates
                  ServiceHasRates: {
                    where: {
                      deletedAt: null,
                    },
                  },
                },
                where: {
                  deletedAt: null,
                },
              },

              // 2. Setup Services Start(group)
              //  -> Pet Preferances
              ServicePetPreference: {
                select: {
                  id: true,
                },
              },
              //  -> Your Home
              HomeAttributes: {
                select: {
                  id: true,
                },
                where: {
                  deletedAt: null,
                },
              },
              cancellationPolicy: {
                select: {
                  id: true,
                  deletedAt: true,
                },
              },
              quizPassed: true,
            },
          },
        },
      }),
    ]);

    const serviceSelectionCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.SERVICE_SELECTION,
    );

    const serviceSelectionSublist = serviceSelectionCompletion(
      data?.provider?.providerServices?.length > 0,
      SERVICE_SELECTION_SUBLIST.PROVIDER_SERVICE,
      'No services selected',
    );

    const serviceSetupCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.SERVICE_SETUP,
    );

    serviceSetupCompletion(
      !!data?.provider?.ServicePetPreference?.id,
      SERVICE_SETUP_SUBLIST.PROVIDER_PET_PREFERANCE,
      'Pet Service Preferances must be included',
    );

    serviceSetupCompletion(
      !data?.provider?.cancellationPolicy?.deletedAt &&
        !!data?.provider?.cancellationPolicy?.id,
      SERVICE_SETUP_SUBLIST.CANCELLATION_POLICY,
      'Cancellation policy has to be added',
    );

    const serviceSetupSublist = serviceSetupCompletion(
      (data?.provider?.HomeAttributes?.length ?? 0) > 0,
      SERVICE_SETUP_SUBLIST.HOME_ATTRIBUTES,
      'Home attributes has not been added',
    );

    // service map
    const serviceTypeGroupSetupMap = new Map<string, any>();

    services.forEach((item) => {
      const placeholderServiceSetupMap = new Map();
      const placeHolderBody = {
        complete: false,
        message: `${item.slug} has not been chosen by provider`,
      };

      placeholderServiceSetupMap.set(
        SERVICE_SETUP_SUBLIST.AVAILABILITY,
        placeHolderBody,
      );

      placeholderServiceSetupMap.set(
        SERVICE_SETUP_SUBLIST.SERVICE_RATES,
        placeHolderBody,
      );

      serviceTypeGroupSetupMap.set(
        item.slug,
        mapToObject(placeholderServiceSetupMap),
      );
    });

    data?.provider?.providerServices?.forEach((item) => {
      const individualServiceSetupMap = new Map();

      const providerServiceAvailabilityStatus =
        (item?.AvailableDay?.length ?? 0) != 0;

      individualServiceSetupMap.set(SERVICE_SETUP_SUBLIST.AVAILABILITY, {
        complete: providerServiceAvailabilityStatus,
        message: `Provider has not add any availability info to ${item?.serviceType?.name}`,
      });

      const providerServiceRatesStatus =
        (item?.ServiceHasRates?.length ?? 0) != 0;

      individualServiceSetupMap.set(SERVICE_SETUP_SUBLIST.SERVICE_RATES, {
        complete: providerServiceRatesStatus,
        message: `Provider has not add any service rates to ${item?.serviceType?.name}`,
      });

      serviceTypeGroupSetupMap.set(
        item?.serviceType?.slug,
        mapToObject(individualServiceSetupMap),
      );
    });

    const profileSetupCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.PROFILE_SETUP,
    );

    profileSetupCompletion(
      data?.basicInfo?.detailsSubmitted ?? false,
      PROFILE_SETUP_SUBLIST.BASIC_INFO,
      'Basic Information is not completed',
    );

    profileSetupCompletion(
      !!data?.provider?.providerDetails &&
        data?.provider?.providerDetails?.yearsOfExperience != null &&
        data?.provider?.providerDetails?.yearsOfExperience != undefined,
      PROFILE_SETUP_SUBLIST.DETAILS,
      'Provider details has not been provided',
    );

    const isContactInfoCompleted =
      !!data?.contact?.phone &&
      !!data?.contact?.verifiedAt &&
      !!data?.emergencyContact?.phone &&
      !!data?.emergencyContact?.email &&
      !!data?.emergencyContact?.name;

    profileSetupCompletion(
      isContactInfoCompleted,
      PROFILE_SETUP_SUBLIST.CONTACT,
      'Contact Information or Emergency contact is not provided',
    );

    profileSetupCompletion(
      (data?.Gallery?.length ?? 0) > 0,
      PROFILE_SETUP_SUBLIST.GALLERY,
      'Gallery is incomplete',
    );

    const hasPets =
      ((data?.pet?.length ?? 0) > 0 && data?.provider?.havePets === 'YES') ||
      data?.provider?.havePets === 'NO';

    const profileSetupSublist = profileSetupCompletion(
      hasPets,
      PROFILE_SETUP_SUBLIST.PET_MANAGEMENT,
      'If provider HAS pets, the pet list should atleast have one pet added',
    );

    const safetyQuizCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.SAFETY_QUIZ,
    );

    const safetyQuizSublist = safetyQuizCompletion(
      !!data?.provider?.quizPassed,
      SAFETY_QUIZ_SUBLIST.COMPLETE_QUIZ,
      'Quiz has to be passed',
    );

    const subscriptionCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.SUBSCRIPTION,
    );

    const subscriptionSublist = subscriptionCompletion(
      (data?.userSubscriptions?.length ?? 0) > 0,
      SUBSCRIPTION_SUBLIST.SUBSCRIBED,
      'User has to have a vaild subscription',
    );

    const finder = (key: USER_ONBOARDING_STAGES): boolean => {
      // if false is found return false
      const list = statusMap.get(key);

      return !list.some((item) => item === false) && list.length > 0;
    };

    const response = {
      [USER_ONBOARDING_STAGES.SERVICE_SELECTION]: finder(
        USER_ONBOARDING_STAGES.SERVICE_SELECTION,
      ),
      [USER_ONBOARDING_STAGES.SERVICE_SETUP]: finder(
        USER_ONBOARDING_STAGES.SERVICE_SETUP,
      ),
      [USER_ONBOARDING_STAGES.PROFILE_SETUP]: finder(
        USER_ONBOARDING_STAGES.PROFILE_SETUP,
      ),
      [USER_ONBOARDING_STAGES.SAFETY_QUIZ]: finder(
        USER_ONBOARDING_STAGES.SAFETY_QUIZ,
      ),
      [USER_ONBOARDING_STAGES.SUBSCRIPTION]: finder(
        USER_ONBOARDING_STAGES.SUBSCRIPTION,
      ),
      serviceSelectionSublist: mapToObject(serviceSelectionSublist),
      serviceSetupSublist: mapToObject(serviceSetupSublist),
      individualServiceSetupSublist: mapToObject(serviceTypeGroupSetupMap),
      profileSetupSublist: mapToObject(profileSetupSublist),
      safetyQuizSublist: mapToObject(safetyQuizSublist),
      subscriptionSublist: mapToObject(subscriptionSublist),
    };

    return response;
  }
}
