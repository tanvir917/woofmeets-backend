import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginDto } from 'src/auth/dto/login.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AdminPanelService } from './admin-panel.service';
import { ProviderServiceToggleDto } from './dto/provider-service.toggle.dto';

@ApiTags('Admin-Panel')
@Controller('admin-panel')
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  @Post('/log-in')
  async adminLogin(
    @Body() loginDto: LoginDto,
    @Response({ passthrough: true }) res: any,
  ) {
    return await this.adminPanelService.adminLogin(loginDto, res);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/home-page')
  async getLandingPageDetails(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.getLandingPageDetails(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/all-users')
  async getAllUsers(@Query('email') email: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.getAllUsers(userId, email);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/user-details')
  async getUserDetails(@Query('email') email: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.getUserDetails(userId, email);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/user/permanent-block')
  async userPermanentBlock(@Query('email') email: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.userPermanentBlock(userId, email);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/all-providers')
  async getAllProviders(@Query('email') email: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.getAllProviders(userId, email);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/provider-details')
  async getProviderDetails(@Query('email') email: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.getProviderDetails(userId, email);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/provider/approval')
  async toggleProviderApproval(
    @Query('email') email: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.toggleProviderApproval(userId, email);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/provider/service-approval')
  async toggleProviderServiceApproval(
    @Query('email') email: string,
    @Body() providerServiceToggleDto: ProviderServiceToggleDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.toggleProviderServiceApproval(
      userId,
      email,
      providerServiceToggleDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/provider/background-check')
  async providerBackgroundCheck(
    @Query('email') email: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.providerBackgroundCheck(userId, email);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/provider/update/background-check')
  async updateProviderBackgroundCheck(
    @Query('email') email: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.updateroviderBackgroundCheck(
      userId,
      email,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/all-appointments')
  async getAllAppointments(
    @Query('opk') opk: string,
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.getAllAppointments(userId, opk, status);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/appointment-details')
  async getAppointmentDetails(@Query('opk') opk: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.getAppointmentDetails(userId, opk);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/transaction-count-details')
  async getTransactionCountDetails(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.getTransactionCountDetails(
      userId,
      startDate,
      endDate,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/country-wise-provider-count')
  async getCountryWiseProviderCount(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.adminPanelService.getCountryWiseProviderCount(userId);
  }
}
