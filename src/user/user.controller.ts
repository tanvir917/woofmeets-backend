import {
  Controller,
  Delete,
  UseInterceptors,
  UseGuards,
  Request,
  Response,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SecretService } from '../secret/secret.service';
import { TransformInterceptor } from '../transform.interceptor';
import { UserService } from './user.service';

@ApiTags('User')
@UseInterceptors(TransformInterceptor)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly secretService: SecretService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete()
  remove(@Request() req: any, @Response({ passthrough: true }) res: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);

    res.cookie('token', '', {
      maxAge: 0,
      httpOnly: true,
      domain: this.secretService.getCookieCreds().cookieDomain,
      secure: true,
    });

    return this.userService.removeUserAccount(userId);
  }
}
