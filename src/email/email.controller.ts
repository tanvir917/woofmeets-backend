import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TestEmailDto } from './dto/test.email.dto';
import { EmailService } from './email.service';

@ApiTags('Email System (Only For Backend Use)')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async sendEmail(@Body() testEmailDto: TestEmailDto) {
    return this.emailService.sendEmail(testEmailDto);
  }
}
