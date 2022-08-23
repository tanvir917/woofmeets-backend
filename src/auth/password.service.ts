import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EmailService } from 'src/email/email.service';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { ForgetPasswordDto } from './dto/forget.pass.dto';

@Injectable()
export class PasswordService {
  constructor(
    private readonly secretService: SecretService,
    private readonly emailService: EmailService,
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

  async forgetPassword(userId: bigint, dto: ForgetPasswordDto) {
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

    this.emailService.forgetPasswordConfirmEmail(user.email, user.firstName);

    return { message: 'User password updated successfully.' };
  }
}
