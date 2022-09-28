import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { PostMessageDto } from './dto/messages.dto';
import { MessagingProxyService } from './messaging.service';

@ApiTags('Messaging')
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingProxyService) {}

  @Post()
  @ApiBody({ type: PostMessageDto })
  async communicateWithExpress(@Body() body?: PostMessageDto) {
    return this.messagingService.sendMessage(body?.message);
  }
}
