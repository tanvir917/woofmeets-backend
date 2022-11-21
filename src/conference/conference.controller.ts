import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConferenceService } from './servcies/conference.service';
import { UpdateConferenceDto } from './dto/update-conference.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateRoomDto } from './dto/create-room.dto';
import { TransformInterceptor } from 'src/transform.interceptor';
import { FindRoomDto, JoinRoomDto, LeaveRoomDto } from './dto/room.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@ApiTags('Conference - audio / video call | 100ms')
@UseInterceptors(TransformInterceptor)
@Controller('conference')
export class ConferenceController {
  constructor(private readonly conferenceService: ConferenceService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('create-room')
  createRoom(@Body() body: CreateRoomDto) {
    return this.conferenceService.createRoom(body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('join-room')
  joinRoom(@Body() body: JoinRoomDto) {
    return this.conferenceService.joinRoom(body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('leave-room')
  leaveRoom(@Body() body: LeaveRoomDto) {
    return this.conferenceService.leaveRoom(body);
  }

  // admin and system purpose
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('rooms')
  findAll(@Query() query: FindRoomDto) {
    return this.conferenceService.findAll(query);
  }
}
