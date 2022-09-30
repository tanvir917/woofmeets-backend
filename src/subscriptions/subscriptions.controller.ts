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
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
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
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { MembershipPlanService } from './membership-plan.service';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan-dto';
import { MembershipPlanPricesService } from './membership-plan-prices-service';
import { CreateMembershipPlanPricesDto } from './dto/create-membership-plan-prices.dto';

@ApiTags('Subscriptions')
@UseInterceptors(TransformInterceptor)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private membershipPlanService: MembershipPlanService,
    private membershipPlanPricesService: MembershipPlanPricesService,
  ) {}

  @Get('membership-plans')
  getSubscriptionPlans() {
    return this.membershipPlanService.getMembershipPlans();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('membership-plans')
  createPlans(@Body() createMembershipPlanDto: CreateMembershipPlanDto) {
    return this.membershipPlanService.createMembershipPlan(
      createMembershipPlanDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('membership-plans/:planId')
  updatePlans(
    @Body() updateMembershipPlanDto: UpdateMembershipPlanDto,
    @Param('planId') planId: string,
  ) {
    return this.membershipPlanService.updateMembershipPlan(
      BigInt(planId),
      updateMembershipPlanDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('membership-plans/:planId')
  deletePlans(@Param('planId') planId: string) {
    return this.membershipPlanService.deleteMembershipPlan(BigInt(planId));
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('membership-plans/:planId/prices')
  createPlanPrice(
    @Param('planId') planId: string,
    @Body() createMembershipPlanPricesDto: CreateMembershipPlanPricesDto,
  ) {
    return this.membershipPlanPricesService.createMembershipPlanPrice(
      BigInt(planId),
      createMembershipPlanPricesDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('membership-plans/:planId/prices/:priceId')
  deletePlanPrice(@Param('priceId') priceId: string) {
    return this.membershipPlanPricesService.deleteMembershipPlanPrice(
      BigInt(priceId),
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
}
