import { Injectable } from '@nestjs/common';
import { MailgunService } from '@nextnm/nestjs-mailgun';
import { SecretService } from 'src/secret/secret.service';
import { TestEmailDto } from './dto/test.email.dto';
import { ForgetPasswordTemplate } from './template/forget-password.template.dto';
import { PaymentAppointmentTemplate } from './template/paid-appointment.template';
import { TempAppointmentTemplate } from './template/temp-appointment.tepmlate';
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

  async appointmentAcceptEmail(email: string, status?: string) {
    const content = new TempAppointmentTemplate(status).html();
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: 'Appointment accepted notification',
        html: content,
      },
    );
  }

  async appointmentCreationEmail(email: string, status?: string) {
    const content = new TempAppointmentTemplate(status).html();
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: 'New appointment notification',
        html: content,
      },
    );
  }

  async appointmentPaymentEmail(email: string, amount: number, txnId: string) {
    const content = new PaymentAppointmentTemplate({ amount, txnId }).html();
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: 'Appointment payment notification',
        html: content,
      },
    );
  }

  async appointmentCancelEmail(email: string, status?: string) {
    const content = new TempAppointmentTemplate(status).html();
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: 'Appointment cancelled notification',
        html: content,
      },
    );
  }

  async appointmentCompleteEmail(email: string, status?: string) {
    const content = new TempAppointmentTemplate(status).html();
    return this.mailgunService.createEmail(
      this.secretService.getMailgunCreds().domain,
      {
        from: this.secretService.getMailgunCreds().from,
        to: email,
        subject: 'Appointment completed notification',
        html: content,
      },
    );
  }
}
