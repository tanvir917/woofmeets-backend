import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateGroupDTO, PostMessageDto } from './dto/messages.dto';
import { MessagingProxyService } from './messaging.service';

@ApiTags('Messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingProxyService) {}

  @Post('/sendMessageWithAMQP')
  @ApiBody({ type: PostMessageDto })
  async communicateWithExpress(@Body() body?: PostMessageDto) {
    return this.messagingService.sendMessage(body?.message);
  }

  @Post('/createGroup')
  @ApiBody({ type: CreateGroupDTO })
  async createGroup(@Body() body: CreateGroupDTO) {
    return this.messagingService.createGroup('axios', body);
  }
}
