import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { nanoid } from 'nanoid';
import {
  throwBadRequestErrorCheck,
  throwConflictErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { LoginProviderEnum } from 'src/utils/enums';
import { checkZipcode } from 'src/utils/tools/zipcode.checker.tools';
import { SignupDto } from './dto/signup.dto';
import { PasswordService } from './password.service';

interface ILoginPayload {
  email: string;
  password?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private secretService: SecretService,
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private passwordService: PasswordService,
  ) {}

  async validateUser(username: string, password: string) {
    const foundUser = await this.prismaService.user.findFirst({
      where: {
        email: username,
      },
    });
    throwNotFoundErrorCheck(!foundUser, 'User with this email not found');

    const isPasswordValid = await this.passwordService.comparePassword(
      password,
      foundUser.password,
    );
    throwBadRequestErrorCheck(!isPasswordValid, 'Password is not correct');

    const { password: ignoredPassword, ...others } = foundUser;
    const response = await this.login(others);
    return {
      message: 'Request processed successfully',
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

  async signup(userInfo: SignupDto) {
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

    let opk = nanoid();
    let opkGenerated = false;
    while (!opkGenerated) {
      const checkOpk = await this.prismaService.user.findFirst({
        where: {
          opk,
          deletedAt: null,
        },
      });
      if (checkOpk) {
        opk = nanoid();
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

    return {
      message: 'Signup is successful.',
      data: response,
    };
  }
}
