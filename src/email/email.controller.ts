import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async sendEmail(
    @Body() body: { email: string; subject: string; message: string },
  ) {
    return this.emailService.sendEmail(body.email, body.subject, body.message);
  }
}
