import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CommonService } from 'src/common/common.service';
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
  ) {}

  async validateUser(loginDto: LoginDto, res: any) {
    const { email, password } = loginDto;
    const foundUser = await this.prismaService.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });
    throwNotFoundErrorCheck(!foundUser, 'Email not found please sign up.');

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      foundUser.password,
    );
    throwBadRequestErrorCheck(!isPasswordValid, 'Password is not correct.');

    const { password: ignoredPassword, ...others } = foundUser;
    const response = await this.login(others);

    res.cookie('token', response?.access_token, {
      expires: new Date(
        new Date().getTime() + this.secretService.getCookieCreds().cookieExpire,
      ),
      sameSite: 'lax',
      httpOnly: true,
    });

    return {
      message: 'Login Successful.',
      data: response,
    };
  }

  async login<T extends ILoginPayload>(payload: T) {
    const token = this.jwtService.sign({ ...payload });
    const { password, ...other } = payload ?? {};
    console.log({ token });
    return {
      access_token: token,
      info: other,
    };
  }

  async signup(userInfo: SignupDto, res: any) {
    const { email, firstName, lastName, zipcode, password } = userInfo;

    //Check unique email
    const emailTaken = await this.prismaService.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

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
        email,
        zipcode,
        loginProvider: LoginProviderEnum.LOCAL,
      },
    });

    throwBadRequestErrorCheck(!user, 'User is not created');

    const { password: ignoredPassword, ...others } = user;

    const response = await this.login(others);

    res.cookie('token', response?.access_token, {
      expires: new Date(
        new Date().getTime() + this.secretService.getCookieCreds().cookieExpire,
      ),
      sameSite: 'lax',
      httpOnly: true,
    });

    return {
      message: 'Signup is successful.',
      data: response,
    };
  }

  async OAuthSignup(signupDto: SocialAuthDto, res: any) {
    const { email, firstName, lastName, provider, facebookId } = signupDto;

    //Check unique email
    let user = await this.prismaService.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

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
          email,
          loginProvider: provider,
          google: provider == 'GOOGLE' ? true : null,
          facebook: provider == 'FACEBOOK' ? facebookId ?? null : null,
        },
      });

      throwBadRequestErrorCheck(!user, 'User is not created');
    } else {
      const signinProvider =
        user?.loginProvider == 'LOCAL'
          ? 'EMAIL and PASSWORD'
          : user?.loginProvider;

      throwConflictErrorCheck(
        user?.loginProvider != provider,
        `Email already exists, please login through ${signinProvider} login.`,
      );
    }

    const { password: ignoredPassword, ...others } = user;

    const response = await this.login(others);

    res.cookie('token', response?.access_token, {
      expires: new Date(
        new Date().getTime() + this.secretService.getCookieCreds().cookieExpire,
      ),
      sameSite: 'lax',
      httpOnly: true,
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

    const { password: ignoredPassword, ...others } = user;

    return { message: 'User info found successfully.', data: others };
  }
}
