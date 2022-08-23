import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UseGuards,
  Request,
  Get,
  Patch,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TransformInterceptor } from 'src/transform.interceptor';
import { CreateBasicInfoDto } from './dto/create-user-basic-info.dto';
import { ProfileImageUploadBodyDto } from './dto/profile-image-upload-body.dto';
import { UpdateBasicInfoDto } from './dto/update-user-basic-info';
import { UserProfileBasicInfoService } from './user-profile-basic-info.service';

@ApiTags('User Profile')
@UseInterceptors(TransformInterceptor)
@Controller('user-profile')
export class UserProfileController {
  constructor(
    private readonly userProfileBasicInfoService: UserProfileBasicInfoService,
  ) {}

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

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('basic-info')
  getBasicInfo(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.userProfileBasicInfoService.getBasicInfo(userId);
  }

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
    // throwBadRequestErrorCheck(!files?.length, 'No files uploaded');
    // const uploadedFiles = await this.multerFileUploadService.uploadMultiple(
    //   files,
    //   'test-files',
    // );

    // return uploadedFiles;
  }
}
