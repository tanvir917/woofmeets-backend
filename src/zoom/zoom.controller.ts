import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { throwBadRequestErrorCheck } from 'src/global/exceptions/error-logic';
import { CreateZoomInfoDto } from './dto/create.zoominfo.dto';
import { CreateZoomLinkDto } from './dto/create.zoomlink.dto';
import { ZoomService } from './zoom.service';

@ApiTags('Zoom')
@Controller('zoom')
export class ZoomController {
  constructor(private readonly zoomService: ZoomService) {}

  @ApiOperation({
    summary: 'Only for backend use. Get User details.',
  })
  @Get('/user-details')
  async getUserDetails(
    @Response({ passthrough: true }) res: any,
    @Request() req: any,
  ) {
    return this.zoomService.getUserDetails(req, res);
  }

  @ApiOperation({
    summary: 'Only for backend user. Get refresh access token.',
  })
  @Get('/get/refresh-access-token')
  async getRefreshAccessToken(@Query('refreshToken') refreshToken: string) {
    return this.zoomService.getRefreshAccessToken(refreshToken);
  }

  @ApiOperation({
    summary: 'Only for backend use. For revoking access token.',
  })
  @Get('/get/revoke-access-token')
  async getRevokeAccessToken(@Query('accessToken') accessToken: string) {
    return this.zoomService.getRevokeAccessToken(accessToken);
  }

  @ApiOperation({
    summary: 'Only for backend use. Get host details.',
  })
  @Get('/host-details')
  async getHostDetails(@Query('token') token: string) {
    return this.zoomService.getHostDetails(token);
  }

  @ApiOperation({
    summary: 'Only for backend use. Get zoom link.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/link/:meetingId')
  async getZoomLink(
    @Param('meetingId') meetingId: string,
    @Query('token') token: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !meetingId || meetingId == undefined,
      'Invalid meeting id. Please, try again after sometime with valid meeting id.',
    );
    return this.zoomService.getZoomLink(userId, meetingId, token);
  }

  @ApiOperation({
    summary: 'Save refresh token in DB.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/save/refresh-token')
  async saveRefreshToken(
    @Body() createZoomInfoDto: CreateZoomInfoDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    return this.zoomService.saveRefreshToken(userId, createZoomInfoDto);
  }

  @ApiOperation({
    summary: 'Create a valid zoom link.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/new-link')
  async createValidZoomLink(@Request() req: any) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);

    return this.zoomService.createValidZoomLink(userId);
  }

  @ApiOperation({
    summary: 'Only for backend use. Update a valid zoom link.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('link/:meetingId')
  async updateZoomLink(
    @Param('meetingId') meetingId: string,
    @Query('token') token: string,
    @Body() createZoomLinkDto: CreateZoomLinkDto,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !meetingId || meetingId == undefined,
      'Invalid meeting id. Please, try again after sometime with valid meeting id.',
    );
    return this.zoomService.updateZoomLink(
      userId,
      meetingId,
      token,
      createZoomLinkDto,
    );
  }

  @ApiOperation({
    summary: 'Only for backend use. Delete a valid zoom link.',
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('link/:meetingId')
  async deleteZoomLink(
    @Param('meetingId') meetingId: string,
    @Query('token') token: string,
    @Request() req: any,
  ) {
    const userId = BigInt(req.user?.id) ?? BigInt(-1);
    throwBadRequestErrorCheck(
      !meetingId || meetingId == undefined,
      'Invalid meeting id. Please, try again after sometime with valid meeting id.',
    );

    return this.zoomService.deleteZoomLink(userId, meetingId, token);
  }
}
