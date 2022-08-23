import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { SecretService } from 'src/secret/secret.service';
import { SmsBodyDto } from './dto/smsbody.dto';
import { SmsService } from './sms.service';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
  constructor(
    private readonly smsService: SmsService,
    private readonly secretService: SecretService,
  ) {}

  @Post()
  @ApiBody({
    type: SmsBodyDto,
  })
  async testMessage(@Body() data: SmsBodyDto) {
    if (this.secretService.getTwilioCreds().allowTest) {
      const response = await this.smsService.sendText(data.to, data.message);
      console.log(response?.[0]);
      return response[0];
    }
    return 'Test is blocked from environment';
  }
}
