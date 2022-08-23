import { Injectable } from '@nestjs/common';
import { MailgunService } from '@nextnm/nestjs-mailgun';
import { SecretService } from 'src/secret/secret.service';
import { ForgetPasswordEmailDto } from './dto/forgetpass.email.dto';
import { TestEmailDto } from './dto/test.email.dto';
import { ForgetPasswordTemplate } from './template/forget-password.template.dto';

@Injectable()
export class EmailService {
  constructor(
    private mailgunService: MailgunService,
    private secretService: SecretService,
  ) {}

  async sendEmail(param: TestEmailDto) {
    const { email, subject, message } = param;
    const content = new ForgetPasswordTemplate(email).html();
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: subject,
        text: message,
        html: content,
      },
    );
  }

  async forgetPasswordConfirmEmail(email: string, name?: string) {
    const content = new ForgetPasswordTemplate(name).html();
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: 'Password changed for Woofmeets account.',
        html: content,
      },
    );
  }
}
