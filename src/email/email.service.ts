import { Injectable } from '@nestjs/common';
import { MailgunService } from '@nextnm/nestjs-mailgun';
import { PinoLogger } from 'nestjs-pino';
import { SecretService } from 'src/secret/secret.service';
import { TestEmailDto } from './dto/test.email.dto';
import { ForgetPasswordTemplate } from './template/forget-password.template.dto';
import { PaymentAppointmentForProviderTemplate } from './template/paid-appointment-for-provider.template';
import { PaymentAppointmentTemplate } from './template/paid-appointment.template';
import { TempAppointmentTemplate } from './template/temp-appointment.tepmlate';
import { UpdatePasswordTemplate } from './template/update-password.template.dto';

@Injectable()
export class EmailService {
  constructor(
    private mailgunService: MailgunService,
    private secretService: SecretService,
    private logger: PinoLogger,
  ) {
    this.logger.setContext(EmailService.name);
  }

  async sendEmail(param: TestEmailDto) {
    try {
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
    } catch (error) {
      return null;
    }
  }

  async updatePasswordConfirmEmail(email: string, name?: string) {
    try {
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
    } catch (error) {
      return null;
    }
  }

  async forgetPasswordOTPEmail(email: string, otp?: string) {
    try {
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
    } catch (error) {
      return null;
    }
  }

  async signupWelcomeEmail(email: string) {
    try {
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: this.secretService.getMailgunCreds().from,
          to: email,
          subject: 'Welcome to Woofmeets',
          template: 'cms_woofmeets',
        },
      );
    } catch (error) {
      //console.log(error?.message);
      this.logger.error(error?.message);
    }
  }

  async completeOnBoardingEmail(email: string) {
    try {
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: this.secretService.getMailgunCreds().from,
          to: email,
          subject: 'Your woofmeets journey begins from here.',
          template: 'signup_welcome',
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentAcceptEmail(email: string, status?: string) {
    try {
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
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentCreationEmail(email: string, status?: string) {
    try {
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
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentPaymentEmail(email: string, amount: number, txnId: string) {
    try {
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
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentPaymentForProviderEmail(email: string) {
    try {
      const content = new PaymentAppointmentForProviderTemplate().html();
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: this.secretService.getMailgunCreds().from,
          to: email,
          subject: 'Appointment payment notification',
          html: content,
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentCancelEmail(email: string, status?: string) {
    try {
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
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentCompleteEmail(email: string, status?: string) {
    try {
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
    } catch (error) {
      this.logger.error(error?.message);
    }
  }
}
