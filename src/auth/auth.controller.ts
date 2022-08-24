import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SocialAuthDto } from './dto/social.auth.dto';
import { UpdatePasswordDto } from './dto/update.pass.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ForgetPasswordOtpDto } from './dto/forgetpass.otp.dto';
import { CheckOtpForgetPasswordDto } from './dto/forget.otp.dto';
import { UpdatePasswordOtpToken } from './dto/tokenpassword.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
  ) {}

  @Post('/signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;
    return await this.authService.validateUser(email, password);
  }

  @Post('/OAuth/signup')
  async OAuthSignup(@Body() signupDto: SocialAuthDto) {
    return this.authService.OAuthSignup(signupDto);
  }

  @Post('/OAuth/login')
  async googleLogin(@Body() loginDto: SocialAuthDto) {
    return this.authService.OAuthLogin(loginDto);
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
}
