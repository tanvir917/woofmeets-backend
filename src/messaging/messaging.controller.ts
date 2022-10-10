import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CreateGroupDTO, PostMessageDto } from './dto/messages.dto';
import { MessagingProxyService } from './messaging.service';

@ApiTags('Messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingProxyService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/sendMessageWithAMQP')
  @ApiBody({ type: PostMessageDto })
  async communicateWithExpress(@Body() body?: PostMessageDto) {
    return this.messagingService.sendMessage(body?.message);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/creategroup')
  @ApiBody({ type: CreateGroupDTO })
  async createGroup(@Body() body: CreateGroupDTO) {
    return this.messagingService.createGroup('axios', body);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('/deletegroup/:id')
  async deleteGroup(@Param('id') id: string) {
    return this.messagingService.deleteGroup('axios', id);
  }
}
