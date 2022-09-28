import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { CreateAppointmentProposalDto } from './dto/create-appointment-proposal.dto';
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
