import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { SmsService } from 'src/sms/sms.service';
import {
  CreateEmergencyContactDto,
  CreateUserContactDto,
} from './dto/create-user-contact.dto';
import { v4 } from 'uuid';
import {
  throwBadRequestErrorCheck,
  throwInternalServerErrorCheck,
} from 'src/global/exceptions/error-logic';
import { capitalizeFirstLetter, sixDigitOtpGenerator } from 'src/utils/tools';
import { SecretService } from 'src/secret/secret.service';
@Injectable()
export class UserProfileContactService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: PinoLogger,
    private readonly smsService: SmsService,
    private readonly secretService: SecretService,
  ) {
    this.logger.setContext(UserProfileContactService.name);
  }

  async addContactNumber(userId: bigint, contact: CreateUserContactDto) {
    const { phoneNumber, otp } = contact;

    const previousData = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        contact: {
          select: {
            phone: true,
          },
        },
        Otp: {
          where: {
            recipient: phoneNumber,
            type: 'PHONE',
            generationType: 'PHONE_VERIFICATION',
            invalidated: false,
            code: otp,
            delivered: true,
            expireAt: {
              gte: new Date(Date.now()),
            },
          },
        },
      },
    });

    throwBadRequestErrorCheck(
      previousData?.contact?.phone === phoneNumber,
      'Phone number has already been verified and added',
    );

    throwBadRequestErrorCheck(
      previousData?.Otp?.length == 0,
      'Invalid OTP, please try again. Thankyou!',
    );

    const existing = await this.prismaService.userContact.findFirst({
      where: {
        phone: phoneNumber,
        userId: {
          not: userId,
        },
      },
    });

    throwBadRequestErrorCheck(
      !!existing,
      'Phone number is already taken by another user',
    );

    const [_, userContact] = await this.prismaService.$transaction([
      this.prismaService.userContact.upsert({
        where: {
          userId: userId,
        },
        update: { phone: phoneNumber },
        create: {
          userId: userId,
          phone: phoneNumber,
          verifiedAt: new Date(Date.now()),
        },
      }),
      this.prismaService.userContact.findUnique({
        where: { userId: userId },
      }),
    ]);

    return userContact;
  }

  async generatePhoneOTP(phoneNumber: string, userId: bigint) {
    // window beyond which the OTP is no longer valid
    const deductable = this.secretService.getOtpValidationWindow() * 60 * 1000;
    const otpWindow = new Date(Date.now() - deductable);

    const [previous, totalOtpSentInWindow, existingPhone] =
      await this.prismaService.$transaction([
        this.prismaService.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            firstName: true,
            contact: true,
            Otp: {
              select: {
                expireAt: true,
                createdAt: true,
              },
              where: {
                recipient: phoneNumber,
                type: 'PHONE',
                generationType: 'PHONE_VERIFICATION',
                createdAt: {
                  gte: otpWindow,
                },
              },
            },
          },
        }),
        this.prismaService.otp.count({
          where: {
            userId: userId,
            type: 'PHONE',
            generationType: 'PHONE_VERIFICATION',
            createdAt: {
              gte: otpWindow,
            },
          },
        }),
        this.prismaService.userContact.findFirst({
          where: {
            phone: phoneNumber,
            userId: {
              not: userId,
            },
          },
        }),
      ]);

    throwBadRequestErrorCheck(
      previous?.contact?.phone === phoneNumber,
      'Phone number has already been verified',
    );

    throwBadRequestErrorCheck(
      !!existingPhone,
      'Phone number is already taken by another user',
    );

    throwBadRequestErrorCheck(
      totalOtpSentInWindow > 5,
      'Sorry, you are not allowed to generate more than 5 OTPs in a 12 hour window',
    );

    const code = sixDigitOtpGenerator();

    try {
      this.logger.debug(`Sending OTP ${code} to ${phoneNumber}`);

      // code will expire after 5 minutes
      const expiry = new Date(Date.now() + 5 * 60 * 1000);

      // send OTP using twilio
      await this.smsService.sendText(
        phoneNumber,
        `Dear ${capitalizeFirstLetter(
          previous?.firstName ?? 'User',
        )}, ${code} is your ${
          code.toString().length
        }-digit OTP code. This code is valid for 5 minutes.`,
      );

      // invalidate previous otps and save otp to database
      const [_, data] = await this.prismaService.$transaction([
        this.prismaService.otp.updateMany({
          data: {
            invalidated: true,
          },
          where: {
            userId: userId,
            type: 'PHONE',
            generationType: 'PHONE_VERIFICATION',
            recipient: phoneNumber,
          },
        }),
        this.prismaService.otp.create({
          data: {
            userId: userId,
            type: 'PHONE',
            generationType: 'PHONE_VERIFICATION',
            recipient: phoneNumber,
            delivered: true,
            code: code.toString(),
            expireAt: expiry,
          },
        }),
      ]);

      return { ...data, code: null, id: null };
    } catch (error) {
      throwInternalServerErrorCheck(
        true,
        'Something went wrong while sending OTP. The event has been logged. Please try again after some time, thank you',
      );
    }
  }

  async addEmergencyContact(
    userId: bigint,
    emergencyContactInfo: CreateEmergencyContactDto,
  ) {
    const { email, name, phone } = emergencyContactInfo;

    const previousData =
      await this.prismaService.userEmergencyContact.findUnique({
        where: {
          userId: userId,
        },
      });

    if (
      previousData?.name === name &&
      previousData?.email === email &&
      previousData?.phone === phone
    ) {
      return previousData;
    }

    const [_, data] = await this.prismaService.$transaction([
      this.prismaService.userEmergencyContact.upsert({
        where: {
          userId: userId,
        },
        create: {
          userId: userId,
          email: email,
          name: name,
          phone: phone,
        },
        update: {
          email: email ?? previousData?.email,
          name: name ?? previousData?.name,
          phone: phone ?? previousData?.phone,
        },
      }),
      this.prismaService.userEmergencyContact.findUnique({
        where: {
          userId: userId,
        },
      }),
    ]);

    return data;
  }
}
