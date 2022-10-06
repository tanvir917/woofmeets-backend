import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminPanelService } from './admin-panel.service';

@ApiTags('Admin-Panel')
@Controller('admin-panel')
export class AdminPanelController {
  constructor(private readonly adminPanelService: AdminPanelService) {}

  @Get('/home-page')
  async getLandingPageDetails() {
    return await this.adminPanelService.getLandingPageDetails();
  }

  @Get('/all-users')
  async getAllUsers(@Query('email') email: string) {
    return await this.adminPanelService.getAllUsers(email);
  }

  @Get('/user-details')
  async getUserDetails(@Query('email') email: string) {
    return await this.adminPanelService.getUserDetails(email);
  }

  @Get('/all-providers')
  async getAllProviders(@Query('email') email: string) {
    return await this.adminPanelService.getAllProviders(email);
  }

  @Get('/provider-details')
  async getProviderDetails(@Query('email') email: string) {
    return await this.adminPanelService.getProviderDetails(email);
  }

  @Get('/all-appointments')
  async getAllAppointments(
    @Query('opk') opk: string,
    @Query('status') status: string,
  ) {
    return await this.adminPanelService.getAllAppointments(opk, status);
  }

  @Get('/appointment-details')
  async getAppointmentDetails(@Query('opk') opk: string) {
    return await this.adminPanelService.getAppointmentDetails(opk);
  }
}
