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
  Version,
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
import {
  GetModifiedBoardingHouseSittingPriceDTO,
  GetModifiedDayCarePriceDTO,
  GetModifiedVisitWalkPriceDTO,
} from './dto/appointment-pricing.dto';
import { AppointmentListsQueryParamsDto } from './dto/appointment-query.dto';
import {
  AppointmentStartDto,
  AppointmentStopDto,
} from './dto/appointment-start-stop.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateAppointmentCardDto } from './dto/create-appointment-card.dto';
import { CreateAppointmentProposalDto } from './dto/create-appointment-proposal.dto';
import { PetsCheckDto } from './dto/pet-check.dto';
import { UpdateAppointmentCardDto } from './dto/update-appointment-card.dto';
import { UpdateAppointmentProposalDto } from './dto/update-appointment-proposal.dto';
import { AppointmentCardService } from './services/appointment-card.service';
import { AppointmentPaymentService } from './services/appointment-payment.service';
import { AppointmentProposalService } from './services/appointment-proposal.service';
import { AppointmentProposalServiceV2 } from './services/appointment-proposal.service.V2';

@ApiTags('Appointment')
@Controller('appointment')
export class AppointmentController {
  constructor(
    private readonly appointmentProposalService: AppointmentProposalService,
    private readonly appointmentPaymentService: AppointmentPaymentService,
    private readonly appointmentProposalServiceV2: AppointmentProposalServiceV2,
    private readonly appointmentCardService: AppointmentCardService,
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

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/cancel/:opk')
  async cancelAppointment(
    @Param('opk') opk: string,
    @Body() cancelAppointmentDto: CancelAppointmentDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return this.appointmentProposalService.cancelAppointment(
      userId,
      opk,
      cancelAppointmentDto,
    );
  }

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
  @Get('/get-price/:opk')
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
  @Post('/daycare/get-modified-price')
  async getModifiedDayCarePrice(
    @Request() req: any,
    @Body() body: GetModifiedDayCarePriceDTO,
  ) {
    if (body?.isRecurring) {
      throwBadRequestErrorCheck(
        !(
          body?.recurringStartDate && body?.recurringSelectedDays?.length !== 0
        ),
        'Invalid Request! recurringStartDate and recurringSelectedDays required if isRecurring true',
      );
    } else {
      throwBadRequestErrorCheck(
        body?.dates?.length === 0,
        'Invalid Request! dates are required if isRecurring is false',
      );
    }
    const dates = body?.dates?.map((date) => new Date(date));
    return await this.appointmentProposalService.calculateDayCarePrice(
      BigInt(body.serviceId),
      body.petIds,
      dates,
      body.timeZone,
      body.timing,
      body.isRecurring,
      new Date(body.recurringStartDate),
      body.recurringSelectedDays,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/boarding-housesitting/get-modified-price')
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
      body.timing,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/visit-walk/get-modified-price')
  async getModifiedVisitWalkPrice(
    @Request() req: any,
    @Body() body: GetModifiedVisitWalkPriceDTO,
  ) {
    return await this.appointmentProposalService.calculateVisitWalkPrice(
      BigInt(body.serviceId),
      body.petIds,
      body.isRecurring,
      new Date(body.recurringStartDate),
      body?.proposalVisits,
      body.timeZone,
      BigInt(body.length),
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

  @ApiOperation({ summary: "All appointment's lists with payments" })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/all-appointments-lists')
  async getAllAppointmentsLists(
    @Request() req: any,
    @Query() query: AppointmentListsQueryParamsDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.appointmentPaymentService.getAppointmentListsWithPaymentsForUser(
      userId,
      query,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/complete/:opk')
  async completeAppointment(@Param('opk') opk: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return this.appointmentProposalService.completeAppointment(userId, opk);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/recurring-billing/:opk')
  async recurringAppointmentBilling(
    @Param('opk') opk: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return this.appointmentProposalService.recurringAppointmentBilling(
      userId,
      opk,
    );
  }

  @Version('2')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/update/:opk/proposal')
  async updateProposalV2(
    @Param('opk') opk: string,
    @Request() req: any,
    @Body() updateAppointmentProposalDto: UpdateAppointmentProposalDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return await this.appointmentProposalServiceV2.updateAppointmentProposalV2(
      userId,
      opk,
      updateAppointmentProposalDto,
    );
  }

  @Version('2')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/:opk/proposal')
  async getlatestProposalV2(@Param('opk') opk: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return await this.appointmentProposalServiceV2.getLatestAppointmentProposalV2(
      userId,
      opk,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/card/all-dates/:opk')
  async getAppointmentDates(@Param('opk') opk: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return await this.appointmentCardService.getAppointmentDates(userId, opk);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/card/start-appointment/:appointmentDateId')
  async startAppointment(
    @Param('appointmentDateId') appointmentDateId: string,
    @Request() req: any,
    @Body() appointmentStartDto: AppointmentStartDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !appointmentDateId || appointmentDateId == undefined,
      'Invalid appointment date id. Please, try again after sometime with valid appointment date id.',
    );
    return await this.appointmentCardService.startAppointment(
      userId,
      BigInt(appointmentDateId),
      appointmentStartDto?.startTime,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/card/stop-appointment/:appointmentDateId')
  async stopAppointment(
    @Param('appointmentDateId') appointmentDateId: string,
    @Request() req: any,
    @Body() appointmentStopDto: AppointmentStopDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !appointmentDateId || appointmentDateId == undefined,
      'Invalid appointment date id. Please, try again after sometime with valid appointment date id.',
    );
    return await this.appointmentCardService.stopAppointment(
      userId,
      BigInt(appointmentDateId),
      appointmentStopDto?.stopTime,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/:opk/card/find/pets')
  async findAppointmentCardPets(
    @Param('opk') opk: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    return await this.appointmentCardService.findAppointmentCardPets(
      userId,
      opk,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 50))
  @Post('/card/upload-file/:opk/:appointmentDateId')
  async appointmentCardUploadFile(
    @UploadedFiles() files: Express.Multer.File[],
    @Param('opk') opk: string,
    @Param('appointmentDateId') appointmentDateId: string,
    @Body() body: FileUploadBody,
    @Request() req: any,
  ): Promise<SuccessfulUploadResponse[]> {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !opk || opk == undefined,
      'Invalid appointment opk. Please, try again after sometime with valid appointment opk.',
    );
    throwBadRequestErrorCheck(
      !appointmentDateId || appointmentDateId == undefined,
      'Invalid appointment date id. Please, try again after sometime with valid appointment date id.',
    );
    throwBadRequestErrorCheck(!files?.length, 'No files uploaded');

    return this.appointmentCardService.appointmentCardUploadFile(
      userId,
      opk,
      BigInt(appointmentDateId),
      files,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/card/find/:id')
  async findAppointmentCardById(@Param('id') id: string, @Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !id || id == undefined,
      'Invalid appointment card id. Please, try again after sometime with valid appointment card id.',
    );
    return await this.appointmentCardService.fiindAppointmentCardById(
      userId,
      BigInt(id),
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/card/create')
  async createAppointmentCard(
    @Request() req: any,
    @Body() createAppointmentCardDto: CreateAppointmentCardDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.appointmentCardService.createAppointmentCard(
      userId,
      createAppointmentCardDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('/card/update/:id')
  async updateAppointmentCard(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateAppointmentCardDto: UpdateAppointmentCardDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !id || id == undefined,
      'Invalid appointment card id. Please, try again after sometime with valid appointment card id.',
    );
    return await this.appointmentCardService.updateAppointmentCard(
      userId,
      BigInt(id),
      updateAppointmentCardDto,
    );
  }
}
