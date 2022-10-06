import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { CreateAppointmentProposalDto } from './dto/create-appointment-proposal.dto';
import { PetsCheckDto } from './dto/pet-check.dto';
import { UpdateAppointmentProposalDto } from './dto/update-appointment-proposal.dto';
import { AppointmentProposalService } from './services/appointment-proposal.service';

@ApiTags('Appointment')
@Controller('appointment')
export class AppointmentController {
  constructor(
    private readonly appointmentProposalService: AppointmentProposalService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/provider-services/:opk')
  async getProviderService(@Param('opk') opk: string) {
    return await this.appointmentProposalService.getProviderServices(opk);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/provider-services-details/:appointmentOpk')
  async getProviderServiceDetails(
    @Param('appointmentOpk') appointmentOpk: string,
  ) {
    return await this.appointmentProposalService.getProviderServiceAdditionalRates(
      appointmentOpk,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/distance-check/:userId/:providerId')
  async appointmentDistanceCheck(
    @Param('userId') userId: string,
    @Param('providerId') providerId: string,
  ) {
    throwBadRequestErrorCheck(
      !userId || userId == undefined,
      'Invalid user id. Please, try again after sometime with valid user id.',
    );
    throwBadRequestErrorCheck(
      !providerId || providerId == undefined,
      'Invalid provider id. Please, try again after sometime with valid provider id.',
    );
    return await this.appointmentProposalService.appointmentDistanceCheck(
      BigInt(userId),
      BigInt(providerId),
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/pet-check')
  async appointmentPetCheck(@Body() petsCheckDto: PetsCheckDto) {
    return await this.appointmentProposalService.appointmentsPetsCheck(
      petsCheckDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/inbox')
  async getAllAppointments(
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.appointmentProposalService.getAllAppointments(
      userId,
      status,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/:opk/proposal')
  async getlatestProposal(@Param('opk') opk: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return await this.appointmentProposalService.getLatestAppointmentProposal(
      userId,
      opk,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/create/proposal')
  async createProposal(
    @Request() req: any,
    @Body() createAppointmentProposalDto: CreateAppointmentProposalDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.appointmentProposalService.createAppointmentProposal(
      userId,
      createAppointmentProposalDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/update/:opk/proposal')
  async updateProposal(
    @Param('opk') opk: string,
    @Request() req: any,
    @Body() updateAppointmentProposalDto: UpdateAppointmentProposalDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return await this.appointmentProposalService.updateAppointmentProposal(
      userId,
      opk,
      updateAppointmentProposalDto,
    );
  }
}
