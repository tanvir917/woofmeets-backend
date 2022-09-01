import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CommonService } from 'src/common/common.service';
import { EmailService } from 'src/email/email.service';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { OtpGenerationTypeEnum, OtpTypeEnum } from 'src/utils/enums';
import { CheckOtpForgetPasswordDto } from './dto/forget.otp.dto';
import { ForgetPasswordOtpDto } from './dto/forgetpass.otp.dto';
import { UpdatePasswordOtpToken } from './dto/tokenpassword.dto';
import { UpdatePasswordDto } from './dto/update.pass.dto';

@Injectable()
export class PasswordService {
  constructor(
    private readonly secretService: SecretService,
    private readonly emailService: EmailService,
    private readonly commonService: CommonService,
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async getHashedPassword(password: string) {
    const salt = await bcrypt.genSalt(
      this.secretService.getJwtCreds().saltRound,
    );
    return bcrypt.hash(password, salt);
  }

  /**
   *
   * @param plainPassword password to compare
   * @param hashedPassword hashed password
   * @returns
   */
  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return bcrypt.compare(plainPassword, hashedPassword);
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async updatePassword(userId: bigint, dto: UpdatePasswordDto) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    throwNotFoundErrorCheck(
      !user,
      'User not found with the specific indentifier.',
    );
    throwBadRequestErrorCheck(
      !user.password,
      'Password update unsuccessful due to social signup',
    );

    const isPasswordValid = await this.comparePassword(
      dto.password,
      user.password,
    );
    throwBadRequestErrorCheck(!isPasswordValid, 'Password is not correct');

    const hashedPassword = await this.getHashedPassword(dto.newPassword);
    const updateUser = await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    this.emailService.updatePasswordConfirmEmail(user.email, user.firstName);

    return { message: 'User password updated successfully.' };
  }

  async forgetPasswordOtpGenerate(body: ForgetPasswordOtpDto) {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: body.email,
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!user, 'User not found with specific email.');

    /**
     * before create new otp and db entry
     * we need to check our table with recipient email / phone.
     * if we found 3 row in a hour or 5 in a day then do not create a new otp.
     */
    const dayBefore = new Date().setHours(new Date().getHours() - 24);
    const hourBefore = new Date().setHours(new Date().getHours() - 1);
    const dayOtp = await this.prismaService.otp.count({
      where: {
        generationType: OtpGenerationTypeEnum.FORGET_PASSWORD,
        recipient: body.email,
        createdAt: {
          gte: new Date(dayBefore).toISOString(),
        },
      },
    });

    const hourOtp = await this.prismaService.otp.count({
      where: {
        generationType: OtpGenerationTypeEnum.FORGET_PASSWORD,
        recipient: body.email,
        createdAt: {
          gte: new Date(hourBefore).toISOString(),
        },
      },
    });
    //console.log('day', dayOtp, 'hour', hourOtp);

    if (dayOtp >= 5) {
      throw new BadRequestException(
        'You reached out maximum number of OTP creation for a day. Please try again later.',
      );
    }

    if (hourOtp >= 3) {
      throw new BadRequestException(
        'You reached out maximum number of OTP creation. Please try again later.',
      );
    }

    const code = this.commonService.getOtp();
    const exp = new Date();
    exp.setMinutes(exp.getMinutes() + this.secretService.getOtpDuration());

    await this.prismaService.otp.updateMany({
      where: {
        recipient: body.email,
        generationType: OtpGenerationTypeEnum.FORGET_PASSWORD,
      },
      data: {
        deletedAt: new Date().toISOString(),
      },
    });

    await this.prismaService.otp.create({
      data: {
        recipient: user.email,
        code,
        type: OtpTypeEnum.EMAIL,
        generationType: OtpGenerationTypeEnum.FORGET_PASSWORD,
        expireAt: exp.toISOString(),
        delivered: true,
      },
    });

    this.emailService.forgetPasswordOTPEmail(user.email, code);

    return { message: 'Reset password OTP has been sent.' };
  }

  async forgetPasswordOtpCheck(body: CheckOtpForgetPasswordDto) {
    const otp = await this.prismaService.otp.findFirst({
      where: {
        recipient: body.email,
        deletedAt: null,
        attempt: {
          lt: 3,
        },
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
      ],
    });

    if (otp.code === body.otp) {
      await this.prismaService.otp.update({
        where: {
          id: otp.id,
        },
        data: {
          attempt: otp.attempt + 1,
          success: true,
          updatedAt: new Date().toISOString(),
          deletedAt: new Date().toISOString(),
        },
      });
    } else {
      await this.prismaService.otp.update({
        where: {
          id: otp.id,
        },
        data: {
          attempt: otp.attempt + 1,
          updatedAt: new Date().toISOString(),
        },
      });

      throw new BadRequestException('OTP does not matched.');
    }

    const user = await this.prismaService.user.findFirst({
      where: {
        email: body.email,
        deletedAt: null,
      },
      select: {
        opk: true,
        email: true,
      },
    });

    const token = this.jwtService.sign({ ...user });

    return { message: 'otp matched', data: { token } };
  }

  async updatePasswordWithOtpToken(
    email: string,
    body: UpdatePasswordOtpToken,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    throwNotFoundErrorCheck(
      !user,
      'User not found with the specific indentifier.',
    );

    const hashedPassword = await this.getHashedPassword(body.password);
    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    this.emailService.updatePasswordConfirmEmail(user.email, user.firstName);

    return { message: 'User password updated successfully.' };
  }
}
