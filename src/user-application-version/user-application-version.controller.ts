import {
  Controller,
  Get,
  Body,
  Patch,
  UseInterceptors,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { UserApplicationVersionService } from './user-application-version.service';
import { UpdateUserApplicationVersionDto } from './dto/update-user-application-version.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from '../transform.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetForceUpdateQueryDto } from './dto/get-force-update-query.dto';

@ApiTags('User Application Version')
@UseInterceptors(TransformInterceptor)
@Controller('user-application-version')
export class UserApplicationVersionController {
  constructor(
    private readonly userApplicationVersionService: UserApplicationVersionService,
  ) {}

  @Get('/compare')
  findUserAppVersion(@Query() query: GetForceUpdateQueryDto) {
    return this.userApplicationVersionService.compareUserAppVersion(query);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch()
  postOrUpdateUserAppVersion(
    @Request() req: any,
    @Body() updateUserApplicationVersionDto: UpdateUserApplicationVersionDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userApplicationVersionService.postOrUpdateAppVersion(
      userId,
      updateUserApplicationVersionDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get()
  getAppVersion(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userApplicationVersionService.getApplicationVersion(userId);
  }
}
