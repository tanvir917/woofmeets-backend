import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@prisma/client';
import { CommonService } from 'src/common/common.service';
import { EmailService } from 'src/email/email.service';
import {
  throwBadRequestErrorCheck,
  throwForbiddenErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { AppleTokenDto } from './dto/apple.token.dto';
import { PasswordService } from './password.service';

@Injectable()
export class OAuthService {
  constructor(
    private secretService: SecretService,
    private commonService: CommonService,
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private passwordService: PasswordService,
    private emailService: EmailService,
  ) {}

  async uniqueOpkGenerator(): Promise<string> {
    const opk = this.commonService.getOpk();

    const exists = await this.prismaService.user.findUnique({
      where: {
        opk: opk,
      },
    });

    if (!exists) {
      // base case
      return opk;
    }

    return this.uniqueOpkGenerator();
  }

  async appleSignIn({ token, firstname, lastname }: AppleTokenDto, res: any) {
    // extract info using apple token
    const decodedObj = this.jwtService.decode(token);

    /**
     * @description
     * @type {{ appleAccountId:string;  email:string;  name: { firstName: string; lastName: string; }}}
     * */
    const { appleAccountId, email, name } = {
      appleAccountId: decodedObj?.['sub'] ?? '',
      email: decodedObj?.['email'],
      name: decodedObj?.['user']?.['name'],
    };
    console.log(decodedObj);

    throwBadRequestErrorCheck(
      !appleAccountId,
      'User has to have an associated apple account id',
    );

    throwBadRequestErrorCheck(
      !email,
      'User has to have an associated email address',
    );

    const { firstName, lastName } = name ?? {
      firstName: null,
      lastName: null,
    };

    // check using apple account id whether there is an exisiting user or not

    const [existingUser, emailUser] = await this.prismaService.$transaction([
      this.prismaService.user.findFirst({
        where: {
          appleAccountId: appleAccountId,
        },
        include: {
          provider: {
            select: {
              isApproved: true,
            },
          },
        },
      }),
      // TODO: refactor later
      this.prismaService.user.findFirst({
        where: {
          email: email,
        },
        include: {
          provider: {
            select: {
              isApproved: true,
            },
          },
        },
      }),
    ]);

    // check whether user has been blocked or not
    throwBadRequestErrorCheck(
      !existingUser && existingUser?.deletedAt != null,
      'User has been blocked',
    );

    throwForbiddenErrorCheck(
      !!emailUser && emailUser?.loginProvider != 'APPLE',
      'User is signed up with another strategy',
    );

    let user = existingUser;

    if (!existingUser) {
      const opk = await this.uniqueOpkGenerator();

      user = await this.prismaService.user.create({
        data: {
          email: email,
          firstName: firstName ?? firstname ?? ' ',
          lastName: lastName ?? lastname ?? ' ',
          loginProvider: 'APPLE',
          appleAccountId: appleAccountId,
          opk: opk,
        },
        include: {
          provider: {
            select: {
              isApproved: true,
            },
          },
        },
      });

      // dispatch welcome email
      await this.emailService.signupWelcomeEmail(email);
    }

    const jwt = this.jwtService.sign({
      ...{ ...user, password: undefined },
      provider: user?.provider?.isApproved ? true : false,
    });

    const response = {
      access_token: jwt,
      info: { ...user },
    };

    res.cookie('token', response?.access_token, {
      expires: new Date(
        new Date().getTime() + this.secretService.getCookieCreds().cookieExpire,
      ),
      httpOnly: true,
      domain: this.secretService.getCookieCreds().cookieDomain,
      secure: true,
    });

    return {
      message: 'Sign In Successfully',
      data: response,
    };
  }
}
