import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { USER_ONBOARDING_STAGES } from './dto/user-onboarding-progress.dto';

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
    const incompleteReasonMap = new Map<USER_ONBOARDING_STAGES, string[]>();

    statusMap.set(USER_ONBOARDING_STAGES.SERVICE_SELECTION, []);
    statusMap.set(USER_ONBOARDING_STAGES.SERVICE_SETUP, []);
    statusMap.set(USER_ONBOARDING_STAGES.PROFILE_SETUP, []);
    statusMap.set(USER_ONBOARDING_STAGES.SAFETY_QUIZ, []);
    statusMap.set(USER_ONBOARDING_STAGES.SUBSCRIPTION, []);

    incompleteReasonMap.set(USER_ONBOARDING_STAGES.SERVICE_SELECTION, []);
    incompleteReasonMap.set(USER_ONBOARDING_STAGES.SERVICE_SETUP, []);
    incompleteReasonMap.set(USER_ONBOARDING_STAGES.PROFILE_SETUP, []);
    incompleteReasonMap.set(USER_ONBOARDING_STAGES.SAFETY_QUIZ, []);
    incompleteReasonMap.set(USER_ONBOARDING_STAGES.SUBSCRIPTION, []);

    const addCompletionValue = (key: USER_ONBOARDING_STAGES) => {
      return (isComplete: boolean, incompleteReason?: string) => {
        statusMap.get(key)?.push(isComplete);
        if (!isComplete && incompleteReason) {
          incompleteReasonMap.get(key)?.push(incompleteReason);
        }
      };
    };

    const data = await this.prismaService.user.findFirst({
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
              },
            },

            // 1. select services
            providerServices: {
              select: {
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
            //  -> Cancellation Policy
            cancellationPolicy: {
              select: {
                id: true,
                deletedAt: true,
              },
            },
            // 2. Setup Services End(group)

            // 5. Safety Quiz(group) Quiz
            quizPassed: true,

            // 6. Subscription
            // if basic then true
            // if premium or gold then payment needs to be true
            subscriptionType: true,
          },
        },
      },
    });

    const serviceSelectionCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.SERVICE_SELECTION,
    );

    serviceSelectionCompletion(
      data?.provider?.providerServices?.length > 0,
      'No services selected',
    );

    const serviceSetupCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.SERVICE_SETUP,
    );

    serviceSetupCompletion(
      !!data?.provider?.ServicePetPreference?.id,
      'Pet Service Preferances must be included',
    );

    serviceSetupCompletion(
      !data?.provider?.cancellationPolicy?.deletedAt &&
        !!data?.provider?.cancellationPolicy?.id,
      'Cancellation policy has to be added',
    );

    serviceSetupCompletion(
      (data?.provider?.HomeAttributes?.length ?? 0) > 0,
      'Home attributes has not been added',
    );

    const checkRates =
      data?.provider?.providerServices?.filter(
        (i) => (i.ServiceHasRates?.length ?? 0) === 0,
      ) ?? [];

    serviceSetupCompletion(
      checkRates.length != 0,
      'Service rates has not been added',
    );

    const checkAvailabilityConfig =
      (data?.provider?.providerServices?.filter(
        (i) => (i.AvailableDay?.length ?? 0) === 0,
      )?.length ?? 0) > 0;

    serviceSetupCompletion(
      checkAvailabilityConfig,
      'Availability has not been added',
    );

    const profileSetupCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.PROFILE_SETUP,
    );

    profileSetupCompletion(
      data?.basicInfo?.detailsSubmitted ?? false,
      'Basic Information is not completed',
    );
    profileSetupCompletion(
      !!data?.contact?.phone && !!data?.contact?.verifiedAt,
      'Contact Information is not completed',
    );
    profileSetupCompletion(
      !!data?.emergencyContact?.phone &&
        !!data?.emergencyContact?.email &&
        !!data?.emergencyContact?.name,
      'Emergency Contact Information is not completed',
    );
    profileSetupCompletion(
      (data?.Gallery?.length ?? 0) > 0,
      'Gallery is incomplete',
    );
    profileSetupCompletion(
      (data?.pet?.length ?? 0) > 0,
      'Pet information is required',
    );

    const hasPets =
      ((data?.pet?.length ?? 0) > 0 && data?.provider?.havePets === 'YES') ||
      data?.provider?.havePets === 'NO';
    profileSetupCompletion(
      hasPets,
      'Pets section has not been properly completed',
    );

    const safetyQuizCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.SAFETY_QUIZ,
    );

    safetyQuizCompletion(!!data?.provider?.quizPassed, 'Quiz has to be passed');

    const subscriptionCompletion = addCompletionValue(
      USER_ONBOARDING_STAGES.SUBSCRIPTION,
    );

    const finder = (key: USER_ONBOARDING_STAGES): boolean => {
      // if false is found return false
      const list = statusMap.get(key);

      return !list.some((item) => item === false) && list.length > 0;
    };

    const hints = (key: USER_ONBOARDING_STAGES): string[] => {
      // if false is found return false
      return incompleteReasonMap.get(key) ?? [];
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
      incomplete_message: {
        [USER_ONBOARDING_STAGES.SERVICE_SELECTION]: hints(
          USER_ONBOARDING_STAGES.SERVICE_SELECTION,
        ),
        [USER_ONBOARDING_STAGES.SERVICE_SETUP]: hints(
          USER_ONBOARDING_STAGES.SERVICE_SETUP,
        ),
        [USER_ONBOARDING_STAGES.PROFILE_SETUP]: hints(
          USER_ONBOARDING_STAGES.PROFILE_SETUP,
        ),
        [USER_ONBOARDING_STAGES.SAFETY_QUIZ]: hints(
          USER_ONBOARDING_STAGES.SAFETY_QUIZ,
        ),
        [USER_ONBOARDING_STAGES.SUBSCRIPTION]: hints(
          USER_ONBOARDING_STAGES.SUBSCRIPTION,
        ),
      },
    };

    return response;
  }
}
