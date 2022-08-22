import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { OAuthDto } from './dto/oAuth.dto';
import { SignupDto } from './dto/signup.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async OAuthSignup(@Body() signupDto: OAuthDto) {
    return this.authService.OAuthSignup(signupDto);
  }

  @Post('/OAuth/login')
  async googleLogin(@Body() loginDto: OAuthDto) {
    return this.authService.OAuthLogin(loginDto);
  }
}
