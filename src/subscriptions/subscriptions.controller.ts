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
  Patch,
  Delete,
  Query,
  Version,
  Headers,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateUserBasicVerificationDto } from './dto/create-user-basic-verification.dto';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { MembershipPlanService } from './membership-plan.service';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan-dto';
import { MembershipPlanPricesService } from './membership-plan-prices-service';
import { CreateMembershipPlanPricesDto } from './dto/create-membership-plan-prices.dto';
import { SubscriptionV2Service } from './subscription-v2.service';
import {
  SubscriptionListsForUserQueryParamsDto,
  SubscriptionListsQueryParamsDto,
} from './dto/subscription-list-query-params.dto';
import { CreateSubscriptionQueryDto } from './dto/create-subscription.dto';

@ApiTags('Subscriptions')
@UseInterceptors(TransformInterceptor)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private membershipPlanService: MembershipPlanService,
    private membershipPlanPricesService: MembershipPlanPricesService,
    private subscriptionV2Service: SubscriptionV2Service,
  ) {}

  @Get('membership-plans')
  getSubscriptionPlans() {
    return this.membershipPlanService.getMembershipPlans();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('membership-plans')
  createPlans(
    @Body() createMembershipPlanDto: CreateMembershipPlanDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.membershipPlanService.createMembershipPlan(
      userId,
      createMembershipPlanDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('membership-plans/:planId')
  updatePlans(
    @Body() updateMembershipPlanDto: UpdateMembershipPlanDto,
    @Param('planId') planId: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.membershipPlanService.updateMembershipPlan(
      userId,
      BigInt(planId),
      updateMembershipPlanDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('membership-plans/:planId')
  deletePlans(@Param('planId') planId: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.membershipPlanService.deleteMembershipPlan(
      userId,
      BigInt(planId),
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('membership-plans/:planId/prices')
  createPlanPrice(
    @Param('planId') planId: string,
    @Body() createMembershipPlanPricesDto: CreateMembershipPlanPricesDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.membershipPlanPricesService.createMembershipPlanPrice(
      userId,
      BigInt(planId),
      createMembershipPlanPricesDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('membership-plans/:planId/prices/:priceId')
  deletePlanPrice(@Param('priceId') priceId: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.membershipPlanPricesService.deleteMembershipPlanPrice(
      userId,
      BigInt(priceId),
    );
  }

  /**
   * Subscription
   */

  @ApiOperation({ summary: 'Check if user needs to pay basic verification' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('check-basic-verification-payment')
  async checkBasicVerificationPayment(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.subscriptionV2Service.checkIfNeedToPayBasicPayment(userId);
  }

  @ApiOperation({ summary: 'Pay the basic verification payment' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('pay-basic-verification-payment')
  async payBasicVerificationPayment(
    @Request() req: any,
    @Query('cardId') cardId: string,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.subscriptionV2Service.payBasicPayment(userId, BigInt(cardId));
  }

  @Version('2')
  @ApiOperation({
    summary: 'Pay the basic verification payment V2 with idempotency key.',
  })
  @ApiBearerAuth('access-token')
  @ApiHeader({
    name: 'Idempontency-Key',
    required: true,
    schema: { type: 'string' },
  })
  @UseGuards(JwtAuthGuard)
  @Post('pay-basic-verification-payment')
  async payBasicVerificationPaymentV2(
    @Request() req: any,
    @Query('cardId') cardId: string,
    @Headers('Idempontency-Key') idempontencyKey: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.subscriptionV2Service.payBasicPaymentV2(
      userId,
      BigInt(cardId),
      idempontencyKey,
    );
  }

  // create subscription v1
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribeToPlan(
    @Request() req: any,
    @Query() query: CreateSubscriptionQueryDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.subscriptionV2Service.createSubscriptionV1(userId, query);
  }

  // create subscription v2
  @ApiOperation({
    summary:
      'Create user subscription v2 with idempotency key. UPDATED with 3DS',
  })
  @Version('2')
  @ApiBearerAuth('access-token')
  @ApiHeader({
    name: 'Idempontency-Key',
    required: true,
    schema: { type: 'string' },
  })
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribeToPlanV2(
    @Request() req: any,
    @Query() query: CreateSubscriptionQueryDto,
    @Headers('Idempontency-Key') idempontencyKey: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.subscriptionV2Service.createSubscriptionV2(
      userId,
      query,
      idempontencyKey,
    );
  }

  // create subscription v3
  @ApiOperation({
    summary: 'Create user subscription v3 with idempotency key.',
  })
  @Version('3')
  @ApiBearerAuth('access-token')
  @ApiHeader({
    name: 'Idempontency-Key',
    required: true,
    schema: { type: 'string' },
  })
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribeToPlanV3(
    @Request() req: any,
    @Query() query: CreateSubscriptionQueryDto,
    @Headers('Idempontency-Key') idempontencyKey: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.subscriptionV2Service.createSubscriptionV3(
      userId,
      query,
      idempontencyKey,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('my-current-subscription')
  getUserCurrentSubscription(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.subscriptionV2Service.getUserCurrentSubscription(userId);
  }

  @Version('2')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('my-current-subscription')
  getUserCurrentSubscriptionV2(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.subscriptionV2Service.getUserCurrentSubscriptionV2(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('cancel-subscription')
  cancelSubscription(
    @Request() req: any,
    @Query('subscriptionId') subscriptionId: string,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.subscriptionV2Service.cancelUserSubscription(
      userId,
      BigInt(subscriptionId),
    );
  }

  /**
   * Basic verification info for the provider
   */
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

  /**
   * admin Route
   */
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('user-subscription-lists')
  async getUserSubscriptionLists(
    @Request() req: any,
    @Query() query: SubscriptionListsQueryParamsDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.subscriptionV2Service.getSubscriptionLists(userId, query);
  }

  /**
   * User Route
   */
  @ApiOperation({
    summary: 'Get user subscription lists with pagination. FOR PROVIDER.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('all-subscriptions')
  async getSubscriptionListsOfUser(
    @Request() req: any,
    @Query() query: SubscriptionListsForUserQueryParamsDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.subscriptionV2Service.getUserSubscriptionLists(
      userId,
      query,
    );
  }
}
