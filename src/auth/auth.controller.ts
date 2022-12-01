import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Request,
  Response,
  UseGuards,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SecretService } from 'src/secret/secret.service';
import { TransformInterceptor } from 'src/transform.interceptor';
import { AuthService } from './auth.service';
import { AppleSignUpDto } from './dto/apple.signup.dto';
import { CheckOtpForgetPasswordDto } from './dto/forget.otp.dto';
import { ForgetPasswordOtpDto } from './dto/forgetpass.otp.dto';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SignupDtoV2 } from './dto/signupV2.dto';
import { SocialAuthDto } from './dto/social.auth.dto';
import { UpdatePasswordOtpToken } from './dto/tokenpassword.dto';
import { UpdatePasswordDto } from './dto/update.pass.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PasswordService } from './password.service';

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(TransformInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly secretService: SecretService,
    private readonly passwordService: PasswordService,
  ) {}

  @Post('/signup')
  async signup(
    @Body() signupDto: SignupDto,
    @Response({ passthrough: true }) res: any,
  ) {
    return await this.authService.signup(signupDto, res);
  }

  @Post('/login')
  async login(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res: any,
  ) {
    return await this.authService.validateUser(loginDto, res);
  }

  @Post('/OAuth/signup')
  async OAuthSignup(
    @Body() signupDto: SocialAuthDto,
    @Response({ passthrough: true }) res: any,
  ) {
    return await this.authService.OAuthSignup(signupDto, res);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/update-password')
  async updatePassword(@Request() req: any, @Body() dto: UpdatePasswordDto) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);

    return this.passwordService.updatePassword(userId, dto);
  }

  @Post('/forget-password-otp-generate')
  async forgetPasswordOtpGenerate(@Body() body: ForgetPasswordOtpDto) {
    return this.passwordService.forgetPasswordOtpGenerate(body);
  }

  @Post('/forget-password-otp-check')
  async otpCheckForgetPassword(@Body() body: CheckOtpForgetPasswordDto) {
    return this.passwordService.forgetPasswordOtpCheck(body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/forget-password')
  async forgetPassword(
    @Request() req: any,
    @Body() body: UpdatePasswordOtpToken,
  ) {
    const email = req.user?.email;
    const userId = req.user?.id;
    if (userId || !email) {
      return { message: 'Invalid token' };
    }

    return this.passwordService.updatePasswordWithOtpToken(email, body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/whoami')
  async userInfo(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);

    return await this.authService.userInfo(userId);
  }

  @Get('/logout')
  async logout(@Response({ passthrough: true }) res: any) {
    res.cookie('token', '', {
      maxAge: 0,
      httpOnly: true,
      domain: this.secretService.getCookieCreds().cookieDomain,
      secure: true,
    });

    return {
      message: 'Log out successful.',
    };
  }

  @Version('2')
  @Post('/signup')
  async signupV2(
    @Body() signupDtoV2: SignupDtoV2,
    @Response({ passthrough: true }) res: any,
  ) {
    return await this.authService.signupV2(signupDtoV2, res);
  }

  @Put('/dummy/apple/signup')
  async dummyAppleSignup(@Body() appleSignupDto: AppleSignUpDto) {
    return await this.authService.dummyAppleSignup(appleSignupDto);
  }

  @Get('/dummy/apple/signup/data')
  async dummyAppleSignupData() {
    return await this.authService.getDummyAppleSignupData();
  }
}
