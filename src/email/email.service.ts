import { Injectable } from '@nestjs/common';
import { MailgunService } from '@nextnm/nestjs-mailgun';
import { SecretService } from 'src/secret/secret.service';
import { TestEmailDto } from './dto/test.email.dto';
import { ForgetPasswordTemplate } from './template/forget-password.template.dto';
import { UpdatePasswordTemplate } from './template/update-password.template.dto';

@Injectable()
export class EmailService {
  constructor(
    private mailgunService: MailgunService,
    private secretService: SecretService,
  ) {}

  async sendEmail(param: TestEmailDto) {
    const { email, subject, message } = param;
    const content = new ForgetPasswordTemplate('').html();
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

  async updatePasswordConfirmEmail(email: string, name?: string) {
    const content = new UpdatePasswordTemplate(name).html();
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

  async forgetPasswordOTPEmail(email: string, otp?: string) {
    const content = new ForgetPasswordTemplate(otp).html();
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: 'Reset Password for Woofmeets account.',
        html: content,
      },
    );
  }

  async signupWelcomeEmail(email: string) {
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: 'Welcome to Woofmeets',
        template: 'cms_woofmeets',
      },
    );
  }

  async completeOnBoardingEmail(email: string) {
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: 'Your woofmeets journey begins from here.',
        template: 'signup_welcome',
      },
    );
  }
}
