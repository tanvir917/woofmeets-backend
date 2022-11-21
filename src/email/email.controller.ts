import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { NewMessageDto } from './dto/new-notification.email.dto';
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

  @Post('/notification')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  async sendNotification(@Request() req, @Body() message: NewMessageDto) {
    const user = req.user;
    return this.emailService.newMessageReceivedEmail(
      Number(user?.id ?? -1),
      message,
    );
  }
}
