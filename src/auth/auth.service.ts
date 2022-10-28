import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/common/common.service';
import { EmailService } from 'src/email/email.service';
import {
  throwBadRequestErrorCheck,
  throwConflictErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { LoginProviderEnum } from 'src/utils/enums';
import { checkZipcode } from 'src/utils/tools/zipcode.checker.tools';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SocialAuthDto } from './dto/social.auth.dto';
import { PasswordService } from './password.service';

interface ILoginPayload {
  email: string;
  password?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private secretService: SecretService,
    private commonService: CommonService,
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private passwordService: PasswordService,
    private emailService: EmailService,
  ) {}

  async validateUser(loginDto: LoginDto, res: any) {
    const { email, password } = loginDto;

    const emails = [...new Set([email, email.toLowerCase()])];

    const foundUser = await this.prismaService.user.findFirst({
      where: {
        email: {
          in: emails,
        },
      },
      include: {
        provider: {
          select: {
            isApproved: true,
          },
        },
      },
    });
    throwNotFoundErrorCheck(!foundUser, 'Email not found please sign up.');

    //check if the user is block or not
    throwBadRequestErrorCheck(
      !!foundUser && foundUser?.deletedAt != null,
      'Your account is blocked.',
    );

    const isPasswordValid = foundUser?.password
      ? await this.passwordService.comparePassword(
          password,
          foundUser?.password,
        )
      : null;
    throwBadRequestErrorCheck(!isPasswordValid, 'Password is not correct.');

    const {
      password: ignoredPassword,
      provider: ignoredProvider,
      ...others
    } = foundUser;

    const response = await this.login({
      ...others,
      provider: foundUser?.provider?.isApproved ? true : false,
    });

    res.cookie('token', response?.access_token, {
      expires: new Date(
        new Date().getTime() + this.secretService.getCookieCreds().cookieExpire,
      ),
      httpOnly: true,
      domain: this.secretService.getCookieCreds().cookieDomain,
      secure: true,
    });

    return {
      message: 'Login Successful.',
      data: response,
    };
  }

  async login<T extends ILoginPayload>(payload: T) {
    const token = this.jwtService.sign({ ...payload });
    const { password, ...other } = payload ?? {};
    return {
      access_token: token,
      info: other,
    };
  }

  async signup(userInfo: SignupDto, res: any) {
    const { email, firstName, lastName, zipcode, password } = userInfo;

    const emails = [...new Set([email, email.toLowerCase()])];

    //Check unique email
    const emailTaken = await this.prismaService.user.findFirst({
      where: {
        email: {
          in: emails,
        },
      },
    });

    //check if the user is block or not
    throwBadRequestErrorCheck(
      !!emailTaken && emailTaken?.deletedAt != null,
      'Your account is blocked.',
    );

    //check if email is taken or not
    throwConflictErrorCheck(!!emailTaken, 'Email already taken');

    /*
      Zipcode verification
    */
    throwNotFoundErrorCheck(!checkZipcode(zipcode), 'Zipcode not found');

    const hashedPassword = await this.passwordService.getHashedPassword(
      password,
    );

    let opk = this.commonService.getOpk();
    let opkGenerated = false;
    while (!opkGenerated) {
      const checkOpk = await this.prismaService.user.findFirst({
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

    const user = await this.prismaService.user.create({
      data: {
        opk,
        firstName,
        lastName,
        password: hashedPassword,
        email: email.toLowerCase(),
        zipcode,
        loginProvider: LoginProviderEnum.LOCAL,
      },
      include: {
        provider: {
          select: {
            isApproved: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User is not created');

    //Sending welcome email
    await this.emailService.signupWelcomeEmail(email);

    const {
      password: ignoredPassword,
      provider: ignoredProvider,
      ...others
    } = user;

    const response = await this.login({
      ...others,
      provider: user?.provider?.isApproved ? true : false,
    });

    res.cookie('token', response?.access_token, {
      expires: new Date(
        new Date().getTime() + this.secretService.getCookieCreds().cookieExpire,
      ),
      httpOnly: true,
      domain: this.secretService.getCookieCreds().cookieDomain,
      secure: true,
    });

    return {
      message: 'Signup is successful.',
      data: response,
    };
  }

  async OAuthSignup(signupDto: SocialAuthDto, res: any) {
    const { email, firstName, lastName, provider, facebookId } = signupDto;

    const emails = [...new Set([email, email.toLowerCase()])];

    //Check unique email
    let user = await this.prismaService.user.findFirst({
      where: {
        email: {
          in: emails,
        },
      },
      include: {
        provider: {
          select: {
            isApproved: true,
          },
        },
      },
    });

    //check if the user is block or not
    throwBadRequestErrorCheck(
      !!user && user?.deletedAt != null,
      'Your account is blocked.',
    );

    if (!user) {
      let opk = this.commonService.getOpk();
      let opkGenerated = false;
      while (!opkGenerated) {
        const checkOpk = await this.prismaService.user.findFirst({
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

      user = await this.prismaService.user.create({
        data: {
          opk,
          firstName,
          lastName,
          email: email.toLowerCase(),
          loginProvider: provider,
          google: provider == 'GOOGLE' ? true : null,
          facebook: provider == 'FACEBOOK' ? facebookId ?? null : null,
        },
        include: {
          provider: {
            select: {
              isApproved: true,
            },
          },
        },
      });

      throwBadRequestErrorCheck(!user, 'User is not created');

      //Sending welcome email
      await this.emailService.signupWelcomeEmail(email);
    } else if (user?.loginProvider == 'LOCAL') {
      throwConflictErrorCheck(
        user?.loginProvider != provider,
        `Email already exists, please login through email and password login.`,
      );
    }

    //database facebook id check as user can login through facbook but signup through google
    if (!user?.facebook && facebookId) {
      await this.prismaService.user.update({
        where: {
          id: user?.id,
        },
        data: {
          facebook: facebookId,
        },
      });
    }

    const {
      password: ignoredPassword,
      provider: ignoredProvider,
      ...others
    } = user;

    const response = await this.login({
      ...others,
      provider: user?.provider?.isApproved ? true : false,
    });

    res.cookie('token', response?.access_token, {
      expires: new Date(
        new Date().getTime() + this.secretService.getCookieCreds().cookieExpire,
      ),
      httpOnly: true,
      domain: this.secretService.getCookieCreds().cookieDomain,
      secure: true,
    });

    return {
      message: 'Signup is successful.',
      data: response,
    };
  }

  async userInfo(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
      include: {
        provider: true,
      },
    });

    throwNotFoundErrorCheck(
      !user,
      'User not found with the specific indentifier.',
    );

    const zoomInfo = await this.prismaService.zoomInfo.findFirst({
      where: {
        providerId: user?.provider?.id,
        deletedAt: null,
      },
    });

    const { password: ignoredPassword, ...others } = user;

    return {
      message: 'User info found successfully.',
      data: {
        ...others,
        zoomAuthorized: zoomInfo?.refreshToken?.length > 0 ? true : false,
      },
    };
  }
}
