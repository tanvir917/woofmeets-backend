import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserOnboardingRefreshUrlDto } from './dto/create-stripe-connect.dto';
import { StripeConnectService } from './stripe-connect.service';

@ApiTags('Stripe Connect')
@Controller('stripe-connect')
export class StripeConnectController {
  constructor(private readonly stripeConnectService: StripeConnectService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('user-onboard-status')
  checkUserOnboardStatus(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripeConnectService.checkUserOnboardStatus(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('user-onboarding')
  userOnboarding(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripeConnectService.onboardUser(userId);
  }

  @Post('user-onboarding/refresh-url')
  userOnboardingRefeshUrl(
    @Body() userOnboardingRefreshUrlDto: UserOnboardingRefreshUrlDto,
  ) {
    return this.stripeConnectService.refreshOnboardingLink(
      userOnboardingRefreshUrlDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('user-express-dashboard')
  userStripeExpressDashboard(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.stripeConnectService.userStripeExpressDashboardLink(userId);
  }
}
