import {
  Controller,
  Delete,
  UseInterceptors,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';
import { UserService } from './user.service';

@ApiTags('User')
@UseInterceptors(TransformInterceptor)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete()
  remove(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userService.removeUserAccount(userId);
  }
}
