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

@ApiTags('Admin-Panel')
@Controller('admin-panel')
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
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
}
