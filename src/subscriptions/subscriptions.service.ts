import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { MulterFileUploadService } from '../file/multer-file-upload-service';
import { throwBadRequestErrorCheck } from '../global/exceptions/error-logic';
import { PrismaService } from '../prisma/prisma.service';
import { SecretService } from '../secret/secret.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreateUserBasicVerificationDto } from './dto/create-user-basic-verification.dto';
import {
  ProviderSubscriptionTypeEnum,
  SubscriptionPackageTypeEnum,
} from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  stripe: Stripe;
  constructor(
    private prismaService: PrismaService,
    private secretService: SecretService,
    private multerFileUploadService: MulterFileUploadService,
  ) {
    this.stripe = new Stripe(this.secretService.getStripeCreds().secretKey, {
      apiVersion: this.secretService.getStripeCreds().apiVersion,
    });
  }

  /**
   * Commenting out the below code as we are not using this subscription for now.
   */

  // async createSubscription(
  //   userId: bigint,
  //   subscriptionPlanId: bigint,
  //   createSubscriptionDto: CreateSubscriptionDto,
  // ) {
  //   const { packageType } = createSubscriptionDto;

  //   const subscriptionPlan =
  //     await this.prismaService.subscriptionPlan.findFirst({
  //       where: { id: subscriptionPlanId, active: true, deletedAt: null },
  //     });

  //   throwBadRequestErrorCheck(
  //     !subscriptionPlan,
  //     'Subscription plan not found.',
  //   );

  //   const user = await this.prismaService.user.findFirst({
  //     where: { id: userId, deletedAt: null },
  //     include: {
  //       provider: true,
  //       userSubscriptions: {
  //         where: {
  //           deletedAt: null,
  //           status: 'active',
  //           currentPeriodStart: {
  //             lte: new Date(),
  //           },
  //           currentPeriodEnd: {
  //             gt: new Date(),
  //           },
  //         },
  //       },
  //     },
  //   });

  //   throwBadRequestErrorCheck(!user, 'User not found');

  //   throwBadRequestErrorCheck(!user.provider, 'User is not a provider.');

  //   /**
  //    * Check if user has an active subscription
  //    * If yes, check if the subscription plan is not basic
  //    */
  //   throwBadRequestErrorCheck(
  //     user?.userSubscriptions?.length &&
  //       user?.userSubscriptions[0]?.subscriptionPlan?.slug != 'basic',
  //     'User already have a subscription. Please cancel the existing subscription to continue.',
  //   );

  //   /**
  //    * Check if user has an active subscription
  //    * If yes, check if inputted subscription plan and active subscription plan are
  //    * both basic subscription plans.
  //    */
  //   throwBadRequestErrorCheck(
  //     user?.userSubscriptions[0]?.subscriptionPlan?.slug == 'basic' &&
  //       subscriptionPlan?.slug == 'basic',
  //     'User already have basic subscription. Please upgrade subscription plan to continue.',
  //   );

  //   /**
  //    * check if the package is basic. If basic then dont initiate payment
  //    * Update user subscription type in user table
  //    */

  //   let cropRate = 0;
  //   let subTotal = 0;
  //   let endDate: Date | null = null;

  //   if (subscriptionPlan?.slug == 'basic') {
  //     endDate = new Date();
  //     /**
  //      * As the subscription end date is required.
  //      * For basic subscription, setting the end date to 5 years from now.
  //      */
  //     endDate.setMonth(endDate.getMonth() + 60);

  //     const checker = await this.checkUserSubsOrSignupPayment(user?.id);
  //     console.log('testing Checker');

  //     if (!checker) {
  //       const verificationInfo =
  //         await this.prismaService.userBasicVerification.findFirst({
  //           where: {
  //             userId: user?.id,
  //           },
  //         });

  //       throwBadRequestErrorCheck(
  //         !verificationInfo,
  //         'User verification info is not uploaded.',
  //       );
  //     }

  //     const userSubscriptions =
  //       await this.prismaService.userSubscriptions.create({
  //         data: {
  //           subscriptionPlanId: subscriptionPlan?.id,
  //           userId: user?.id,
  //           subTotal: subscriptionPlan?.monthlyRate,
  //           discount: 0,
  //           total: subscriptionPlan?.monthlyRate,
  //           currency: 'usd',
  //           currentPeriodStart: new Date(),
  //           currentPeriodEnd: endDate,
  //           status: 'active',
  //           paymentStatus: 'none',
  //           packageType: SubscriptionPackageTypeEnum['YEARLY'],
  //         },
  //       });

  //     await this.prismaService.provider.update({
  //       where: { userId: user?.id },
  //       data: {
  //         subscriptionType: 'BASIC',
  //       },
  //     });

  //     throwBadRequestErrorCheck(
  //       !userSubscriptions,
  //       'Subscription not created.',
  //     );

  //     if (checker) {
  //       console.log('In if block', checker);
  //       return {
  //         message: 'Subscription created successfully.',
  //         data: {
  //           paymentRedirect: false,
  //           subscriptionInfo: {
  //             ...userSubscriptions,
  //             subscriptionPlan: subscriptionPlan,
  //           },
  //         },
  //       };
  //     } else {
  //       let paymentIntent: Stripe.PaymentIntent;
  //       try {
  //         paymentIntent = await this.stripe.paymentIntents.create({
  //           amount: 35 * 100,
  //           currency: 'usd',
  //           metadata: {
  //             type: 'default_verification',
  //             userId: user?.id.toString(),
  //             userSubscriptionId: `${userSubscriptions?.id}`,
  //           },
  //         });
  //       } catch (error) {
  //         await this.prismaService.userSubscriptions.update({
  //           where: { id: userSubscriptions?.id },
  //           data: {
  //             deletedAt: new Date(),
  //             paymentStatus: 'failed',
  //             meta: {
  //               reason: 'Payment intent creation failed.',
  //             },
  //           },
  //         });
  //         throwBadRequestErrorCheck(true, 'Subscription creation failed.');
  //       }

  //       await this.prismaService.miscellaneousPayments.create({
  //         data: {
  //           userId: user?.id,
  //           piId: paymentIntent?.id,
  //           total: paymentIntent?.amount / 100,
  //           currency: paymentIntent?.currency,
  //           paid: false,
  //           status: 'pending',
  //           type: 'DEFAULT_VERIFICATION',
  //           src: paymentIntent?.payment_method_types,
  //         },
  //       });
  //       return {
  //         message: 'Subscription created successfully.',
  //         data: {
  //           paymentRedirect: true,
  //           clientSecret: paymentIntent?.client_secret,
  //           subscriptionInfo: {
  //             ...userSubscriptions,
  //             subscriptionPlan: subscriptionPlan,
  //           },
  //         },
  //       };
  //     }
  //   } else {
  //     /**
  //      * Check if user has an active subscription and the subscription plan is basic
  //      * If yes, then cancel the basic subscription to upgrade to a paid subscription
  //      */

  //     const providerSubscriptionType =
  //       subscriptionPlan?.slug == 'gold' ? 'GOLD' : 'PLATINUM';
  //     if (
  //       user?.userSubscriptions?.length &&
  //       user?.userSubscriptions[0]?.subscriptionPlan?.slug == 'basic'
  //     ) {
  //       await this.prismaService.userSubscriptions.update({
  //         where: { id: user?.userSubscriptions[0]?.id },
  //         data: {
  //           status: 'canceled',
  //           currentPeriodEnd: new Date(),
  //           deletedAt: new Date(),
  //         },
  //       });
  //     }

  //     if (packageType == SubscriptionPackageTypeEnum['MONTHLY']) {
  //       subTotal = subscriptionPlan?.monthlyRate;
  //       cropRate =
  //         subscriptionPlan?.monthlyCropRate ?? subscriptionPlan?.monthlyRate;
  //       endDate = new Date();
  //       endDate.setDate(endDate.getDate() + 30);
  //     }

  //     if (packageType == SubscriptionPackageTypeEnum['YEARLY']) {
  //       subTotal = subscriptionPlan?.annualRate;
  //       cropRate =
  //         subscriptionPlan?.annualCropRate ?? subscriptionPlan?.annualRate;
  //       endDate = new Date();
  //       endDate.setDate(endDate.getDate() + 365);
  //     }

  //     const userSubscriptions =
  //       await this.prismaService.userSubscriptions.create({
  //         data: {
  //           subscriptionPlanId: subscriptionPlan?.id,
  //           userId: user?.id,
  //           subTotal,
  //           discount: subTotal - cropRate,
  //           total: cropRate,
  //           currency: 'usd',
  //           currentPeriodStart: new Date(),
  //           currentPeriodEnd: endDate,
  //           status: 'incomplete',
  //           paymentStatus: 'pending',
  //           packageType: SubscriptionPackageTypeEnum[packageType],
  //         },
  //       });

  //     throwBadRequestErrorCheck(
  //       !userSubscriptions,
  //       'Subscription not created.',
  //     );

  //     let paymentIntent: Stripe.PaymentIntent;
  //     try {
  //       paymentIntent = await this.stripe.paymentIntents.create({
  //         amount: userSubscriptions?.total * 100,
  //         currency: 'usd',
  //         metadata: {
  //           type: 'subscription',
  //           userSubscriptionId: `${userSubscriptions?.id}`,
  //         },
  //       });
  //     } catch (error) {
  //       await this.prismaService.userSubscriptions.update({
  //         where: { id: userSubscriptions?.id },
  //         data: {
  //           deletedAt: new Date(),
  //           paymentStatus: 'failed',
  //           meta: {
  //             reason: 'Payment intent creation failed.',
  //           },
  //         },
  //       });
  //       throwBadRequestErrorCheck(true, 'Subscription creation failed.');
  //     }

  //     await this.prismaService.userSubscriptionInvoices.create({
  //       data: {
  //         userSubscriptionId: userSubscriptions?.id,
  //         userId: user?.id,
  //         piId: paymentIntent.id,
  //         total: paymentIntent.amount / 100,
  //         currency: paymentIntent.currency,
  //         paid: false,
  //         status: 'pending',
  //         src: paymentIntent.payment_method_types,
  //       },
  //     });

  //     await this.prismaService.provider.update({
  //       where: { userId: user?.id },
  //       data: {
  //         subscriptionType:
  //           ProviderSubscriptionTypeEnum[providerSubscriptionType],
  //       },
  //     });

  //     return {
  //       message: 'Subscription created successfully.',
  //       data: {
  //         paymentRedirect: true,
  //         clientSecret: paymentIntent?.client_secret,
  //         subscriptionInfo: userSubscriptions,
  //       },
  //     };
  //   }
  // }

  async getSubscriptionPlans() {
    const subscriptionplans =
      await this.prismaService.subscriptionPlan.findMany({
        where: { deletedAt: null },
        orderBy: { sequence: 'asc' },
      });

    throwBadRequestErrorCheck(
      !subscriptionplans,
      'No subscription plans found.',
    );

    return {
      message: 'Subscription plans fetched successfully.',
      data: subscriptionplans,
    };
  }

  async getUserSubscription(userId: bigint) {
    console.log('user id', userId);
    const userSubscription =
      await this.prismaService.userSubscriptions.findFirst({
        where: {
          userId,
          deletedAt: null,
          status: 'active',
          currentPeriodStart: {
            lte: new Date(),
          },
          currentPeriodEnd: {
            gt: new Date(),
          },
        },
        // include: {
        //   subscriptionPlan: true,
        // },
      });

    throwBadRequestErrorCheck(
      !userSubscription,
      'No subscription found for the user.',
    );

    return {
      message: 'User subscription fetched successfully.',
      data: userSubscription,
    };
  }

  async checkUserSubsOrSignupPayment(userId: bigint) {
    const subsPlan = (
      await this.prismaService.subscriptionPlan.findMany({
        where: {
          OR: [
            {
              slug: 'gold',
            },
            {
              slug: 'platinum',
            },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      })
    ).map((plan) => plan.id);

    const subs = await this.prismaService.userSubscriptions.findMany({
      where: {
        userId,
        paymentStatus: 'succeeded',
        // subscriptionPlanId: {
        //   in: subsPlan,
        // },
        userSubscriptionInvoices: {
          paid: true,
          status: 'succeeded',
        },
      },
    });

    if (subs?.length) {
      return true;
    } else {
      const miscellaneous =
        await this.prismaService.miscellaneousPayments.findFirst({
          where: {
            userId,
            status: 'succeeded',
            paid: true,
            type: 'DEFAULT_VERIFICATION',
          },
        });
      if (miscellaneous || miscellaneous != null) {
        return true;
      } else {
        return false;
      }
    }
  }

  async createUserBasicVerificationInfo(
    userId: bigint,
    userBasicVerificationDto: CreateUserBasicVerificationDto,
    files: Express.Multer.File[],
  ) {
    const { dob, state, stateId, dlId } = userBasicVerificationDto;
    const user = await this.prismaService.user.findFirst({
      where: { id: userId },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const filesUploaded = await this.multerFileUploadService.uploadMultiple(
      files,
      'user-basic-verification',
    );

    const userBasicVerification =
      await this.prismaService.userBasicVerification.upsert({
        where: {
          userId,
        },
        update: {
          dob,
          state,
          stateId,
          dlId,
          images: Object(filesUploaded),
        },
        create: {
          userId,
          dob,
          state,
          stateId,
          dlId,
          images: Object(filesUploaded),
        },
      });

    throwBadRequestErrorCheck(
      !userBasicVerification,
      'Verification data upload failed.',
    );

    return {
      message: 'Verification data uploaded successfully.',
      data: userBasicVerification,
    };
  }

  async getUserBasicVerificationInfo(userId: bigint) {
    const userBasicVerification =
      await this.prismaService.userBasicVerification.findFirst({
        where: { userId },
      });

    throwBadRequestErrorCheck(
      !userBasicVerification,
      'No verification data found.',
    );

    return {
      message: 'Verification data fetched successfully.',
      data: userBasicVerification,
    };
  }
}
