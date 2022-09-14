import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Request,
  Get,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';

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
}
