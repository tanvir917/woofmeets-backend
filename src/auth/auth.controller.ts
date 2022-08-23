import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { SocialAuthDto } from './dto/social.auth.dto';
import { ForgetPasswordDto } from './dto/forget.pass.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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
  @Post('/forget-password')
  async forgetPassword(@Request() req: any, @Body() dto: ForgetPasswordDto) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);

    return this.passwordService.forgetPassword(userId, dto);
  }
}
