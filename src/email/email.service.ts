import { Injectable } from '@nestjs/common';
import { MailgunService } from '@nextnm/nestjs-mailgun';
import { SecretService } from 'src/secret/secret.service';

@Injectable()
export class EmailService {
  constructor(
    private mailgunService: MailgunService,
    private secretService: SecretService,
  ) {}

  async sendEmail(email: string, subject: string, message: string) {
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: subject,
        text: message,
        html: ``,
      },
    );
  }
}
