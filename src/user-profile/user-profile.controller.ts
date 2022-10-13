import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransformInterceptor } from 'src/transform.interceptor';
import { ContactResponseDataDto } from './dto/contact-response.dto';
import { CreateProviderDetailsDto } from './dto/create-provider-details.dto';
import { CreateBasicInfoDto } from './dto/create-user-basic-info.dto';
import {
  CreateEmergencyContactDto,
  CreateUserContactDto,
  GeneratePhoneOTPDto,
} from './dto/create-user-contact.dto';
import { CheckHavePetDTo } from './dto/have-pets.dto';
import { ProfileImageUploadBodyDto } from './dto/profile-image-upload-body.dto';
import { UpdateProviderDetailsDto } from './dto/update-provider-details.dto';
import { UpdateBasicInfoDto } from './dto/update-user-basic-info';
import { ProviderDetailsService } from './provider-details.service';
import { UserOnboardingProgressService } from './user-onboarding-progress.service';
import { UserProfileBasicInfoService } from './user-profile-basic-info.service';
import { UserProfileContactService } from './user-profile-contact.service';
import { UserProfileService } from './user-profile.service';

@ApiTags('User Profile')
@UseInterceptors(TransformInterceptor)
@Controller('user-profile')
export class UserProfileController {
  constructor(
    private readonly userProfileBasicInfoService: UserProfileBasicInfoService,
    private readonly userProfileService: UserProfileService,
    private readonly providerDetailsService: ProviderDetailsService,
    private readonly userContactService: UserProfileContactService,
    private readonly userOnboardingService: UserOnboardingProgressService,
  ) {}

  @Get('/country')
  async getCountry() {
    return this.userProfileService.getCountry();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get()
  get(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userProfileService.getUserProfile(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    type: ContactResponseDataDto,
  })
  @Get('/contact')
  async getContact(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userProfileService.getContactInfo(userId);
  }

  @ApiOperation({
    summary: 'Create basic information for proflie section of a user.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('basic-info')
  createBasicInfo(
    @Body() createBasicInfoDto: CreateBasicInfoDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userProfileBasicInfoService.createBasicInfo(
      userId,
      createBasicInfoDto,
    );
  }

  @ApiOperation({
    summary: 'Get basic information for proflie section of a user.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('basic-info')
  getBasicInfo(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userProfileBasicInfoService.getBasicInfo(userId);
  }

  @ApiOperation({
    summary: 'Update basic information for proflie section of a user.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('basic-info')
  updateBasicInfo(
    @Body() updateBasicInfoDto: UpdateBasicInfoDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userProfileBasicInfoService.updateBasicInfo(
      userId,
      updateBasicInfoDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('upload-profile-picture')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('file', 1))
  async postFile(
    @UploadedFiles() file: Express.Multer.File,
    @Body() body: ProfileImageUploadBodyDto,
    @Request() req: any,
  ) {
    console.log('files', file);
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userProfileBasicInfoService.uploadProfilePicture(userId, file);
  }

  @Get('profile-skill-types')
  getProfileSkillTypes() {
    return this.providerDetailsService.providerProfileSkillTypes();
  }

  @ApiOperation({
    summary: 'Create details for proflie section of a user.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('provider-details')
  createProviderDetails(
    @Body() createProviderDetailsDto: CreateProviderDetailsDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.providerDetailsService.createProviderDetails(
      userId,
      createProviderDetailsDto,
    );
  }

  @ApiOperation({
    summary: 'Get details for proflie section of a user.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('provider-details')
  getProviderDetails(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.providerDetailsService.getProviderDetails(userId);
  }

  @ApiOperation({
    summary: 'Update details for proflie section of a user.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('provider-details')
  updateProviderDetails(
    @Body() updateProviderDetailsDto: UpdateProviderDetailsDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.providerDetailsService.updateProviderDetails(
      userId,
      updateProviderDetailsDto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: GeneratePhoneOTPDto,
  })
  @Post('generate-phone-otp')
  async generatePhoneOtp(
    @Request() req: any,
    @Body() phoneOtp: GeneratePhoneOTPDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return {
      data: await this.userContactService.generatePhoneOTP(
        phoneOtp.phoneNumber,
        userId,
      ),
    };
  }

  @ApiOperation({
    summary: 'Can be used for both create and update the contact number.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: CreateUserContactDto,
  })
  @Post('add-contact-number')
  async addContactNumber(
    @Request() req: any,
    @Body() contact: CreateUserContactDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return {
      data: await this.userContactService.addContactNumber(userId, contact),
    };
  }

  @ApiOperation({
    summary: 'Can be used for both create and update the emergency contact.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: CreateEmergencyContactDto,
  })
  @Post('add-emergency-contact-info')
  async addEmergencyContactInfo(
    @Req() req,
    @Body() body: CreateEmergencyContactDto,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return {
      data: await this.userContactService.addEmergencyContact(userId, body),
    };
  }

  @ApiOperation({
    summary: 'For checking have pets in profile section.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    type: CheckHavePetDTo,
  })
  @Post('check-have-pets')
  async checkProfileHavePet(@Req() req, @Body() body: CheckHavePetDTo) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.userProfileService.checkProfileHavePet(userId, body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('onboarding-progress')
  async getOnboardingProgress(@Req() req) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return {
      data: await this.userOnboardingService.getUserOnboardingProgress(userId),
    };
  }

  //Submit the onboarding process when it is completed
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('submit-onboarding-process')
  async submitOnboardingProcess(@Req() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return await this.userProfileService.submitOnboardingProcess(userId);
  }
}
