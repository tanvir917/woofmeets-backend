import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileUploadBody } from 'src/file/dto/file-upload-body.dto';
import { SuccessfulUploadResponse } from 'src/file/dto/upload-flie.dto';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { TransformInterceptor } from '../transform.interceptor';
import {
  GetModifiedBoardingHouseSittingPriceDTO,
  GetModifiedDayCarePriceDTO,
} from './dto/appointment-pricing.dto';
import { CreateAppointmentProposalDto } from './dto/create-appointment-proposal.dto';
import { PetsCheckDto } from './dto/pet-check.dto';
import { UpdateAppointmentProposalDto } from './dto/update-appointment-proposal.dto';
import { AppointmentPaymentService } from './services/appointment-payment.service';
import { AppointmentProposalService } from './services/appointment-proposal.service';
import { AppointmentRecurringService } from './services/appointment-recurring.service';

@ApiTags('Appointment')
@Controller('appointment')
@UseInterceptors(TransformInterceptor)
export class AppointmentController {
  constructor(
    private readonly appointmentProposalService: AppointmentProposalService,
    private readonly appointmentRecurringService: AppointmentRecurringService,
    private readonly appointmentPaymentService: AppointmentPaymentService,
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
  @Get('/provider/inbox')
  async getAllAppointmentsProvider(
    @Query('status') status: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.appointmentProposalService.getAllAppointmentsProvider(
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
  @Get('/:opk/generate-recurring-dates')
  async generateRecurringDates(@Param('opk') opk: string, @Request() req: any) {
    // const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return await this.appointmentRecurringService.generateRecurringDates(opk);
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
      req,
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

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/accept/proposal/:opk')
  async acceptAppointmentProposal(
    @Param('opk') opk: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return await this.appointmentProposalService.acceptAppointmentProposal(
      userId,
      opk,
    );
  }

  // @ApiBearerAuth('access-token')
  // @UseGuards(JwtAuthGuard)
  // @Put('/cancel/:opk')
  // async cancelAppointment(
  //   @Param('opk') opk: string,
  //   @Body() cancelAppointmentDto: CancelAppointmentDto,
  //   @Request() req: any,
  // ) {
  //   const userId = BigInt(req.user?.id) ?? BigInt(-1);
  //   throwBadRequestErrorCheck(
  //     !opk || opk == undefined,
  //     'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
  //   );
  //   return this.appointmentProposalService.cancelAppointment(
  //     userId,
  //     opk,
  //     cancelAppointmentDto,
  //   );
  // }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/proposal/reject/:opk')
  async rejectAppointmentProposal(
    @Param('opk') opk: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return this.appointmentProposalService.rejectAppointmentProposal(
      userId,
      opk,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  @Post('/message/upload-file/:opk')
  async appointmentMessageUploadFile(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('opk') opk: string,
    @Body() body: FileUploadBody,
    @Request() req: any,
  ): Promise<SuccessfulUploadResponse[]> {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    throwBadRequestErrorCheck(!files?.length, 'No files uploaded');

    return this.appointmentProposalService.appointmentMessageUploadFile(
      userId,
      opk,
      files,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/getAppointmentPrice/:opk')
  async getProposalPrice(@Param('opk') opk: string, @Request() req: any) {
    // const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return await this.appointmentProposalService.getProposalPrice(opk);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/getModifiedDayCarePrice')
  async getModifiedDayCarePrice(
    @Request() req: any,
    @Body() body: GetModifiedDayCarePriceDTO,
  ) {
    return await this.appointmentProposalService.calculateDayCarePrice(
      BigInt(body.serviceId),
      body.petIds,
      body.dates,
      body.timeZone,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/getModifiedBoardingHouseSittingPrice')
  async getModifiedBoardingHouseSittingPrice(
    @Request() req: any,
    @Body() body: GetModifiedBoardingHouseSittingPriceDTO,
  ) {
    return await this.appointmentProposalService.calculateBoardingAndHouseSittingPrice(
      BigInt(body.serviceId),
      body.petIds,
      body.proposalStartDate,
      body.proposalEndDate,
      body.timeZone,
    );
  }

  @ApiOperation({
    summary: 'Pay appointment bill v1 with idempotency key.',
  })
  @ApiBearerAuth('access-token')
  @ApiHeader({
    name: 'Idempontency-Key',
    required: true,
    schema: { type: 'string' },
  })
  @UseGuards(JwtAuthGuard)
  @Post('/:opk/billing/:billingId/pay')
  async payAppointmentBilling(
    @Request() req: any,
    @Param('opk') opk: string,
    @Param('billingId') billingId: string,
    @Query('cardId') cardId: string,
    @Headers('Idempontency-Key') idempontencyKey: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.appointmentPaymentService.payAppointmentBilling(
      userId,
      opk,
      BigInt(billingId),
      BigInt(cardId),
      idempontencyKey,
    );
  }
}
