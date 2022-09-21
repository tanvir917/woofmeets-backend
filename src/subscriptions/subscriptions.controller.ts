import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Request,
  Get,
  UploadedFiles,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateUserBasicVerificationDto } from './dto/create-user-basic-verification.dto';

@ApiTags('Subscriptions')
@UseInterceptors(TransformInterceptor)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({
    summary: 'Subscription creation api.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('subscribe/:planId')
  create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Request() req: any,
    @Param('planId') planId: string,
  ) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.subscriptionsService.createSubscription(
      userId,
      BigInt(planId),
      createSubscriptionDto,
    );
  }

  @Get('subscription-plans')
  getSubscriptionPlans() {
    return this.subscriptionsService.getSubscriptionPlans();
  }

  @ApiOperation({
    summary: 'Get subscription details of a user.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('my-subscriptions')
  getMySubscriptions(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.subscriptionsService.getUserSubscription(userId);
  }

  @ApiOperation({
    summary: 'Upload user basic verification informaiton. Max 5 images.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('file', 5))
  @Post('user-basic-verification-info')
  async uploadVerificationInfo(
    @UploadedFiles() file: Express.Multer.File[],
    @Body() body: CreateUserBasicVerificationDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.subscriptionsService.createUserBasicVerificationInfo(
      userId,
      body,
      file,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('user-basic-verification-info')
  async getUserBasicVerificationInfo(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.subscriptionsService.getUserBasicVerificationInfo(userId);
  }
}
