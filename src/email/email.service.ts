import { Injectable } from '@nestjs/common';
import { MailgunService } from '@nextnm/nestjs-mailgun';
import { PinoLogger } from 'nestjs-pino';
import { throwNotFoundErrorCheck } from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { NewMessageDto } from './dto/new-notification.email.dto';
import { TestEmailDto } from './dto/test.email.dto';
import { ForgetPasswordTemplate } from './template/forget-password.template.dto';
import { UpdatePasswordTemplate } from './template/update-password.template.dto';

@Injectable()
export class EmailService {
  constructor(
    private mailgunService: MailgunService,
    private secretService: SecretService,
    private prismaService: PrismaService,
    private logger: PinoLogger,
  ) {
    this.logger.setContext(EmailService.name);
  }

  async newMessageReceivedEmail(userId: number, newMessage: NewMessageDto) {
    const { opk, message } = newMessage;

    const appointment = await this.prismaService.appointment.findFirst({
      where: {
        opk: opk,
      },
      select: {
        providerId: true,
        userId: true,
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
        provider: {
          select: {
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        },
      },
    });

    throwNotFoundErrorCheck(!appointment, `No appointment with ${opk} found`);

    const senderIsProvider = BigInt(userId) === appointment?.providerId;

    const [providerEmail, userEmail] = [
      appointment?.provider?.user?.email,
      appointment?.user?.email,
    ];

    // const senderEmail = senderIsProvider ? providerEmail : userEmail;
    const sendTo = senderIsProvider ? userEmail : providerEmail;

    try {
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: `Woofmeets Message <${
            this.secretService.getMailgunCreds().messageFrom
          }>`,
          to: sendTo,
          subject: 'Appointment new message notification!',
          template: 'appointment_messaging_notification',
          ['h:X-Mailgun-Variables']: JSON.stringify({
            appointment_opk: opk,
            receiver_firstname: senderIsProvider
              ? appointment?.user?.firstName
              : appointment?.provider?.user?.firstName,
            sender_firstname: senderIsProvider
              ? appointment?.provider?.user?.firstName
              : appointment?.user?.firstName,
            message: message,
          }),
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }

    return 'Completed';
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

  async appointmentAcceptEmail(email: string, templateValue?: any) {
    try {
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: `Woofmeets no-reply <${
            this.secretService.getMailgunCreds().from
          }>`,
          to: email,
          subject: 'Appointment accepted notification',
          template: 'appointment_accepted',
          ['h:X-Mailgun-Variables']: JSON.stringify(templateValue),
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentCreationEmail(email: string, templateValue: any) {
    try {
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: `Woofmeets no-reply <${
            this.secretService.getMailgunCreds().from
          }>`,
          to: email,
          subject: 'New appointment creation',
          template: 'appointment_creation',
          ['h:X-Mailgun-Variables']: JSON.stringify(templateValue),
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentModifyEmail(email: string, templateValue: any) {
    try {
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: `Woofmeets no-reply <${
            this.secretService.getMailgunCreds().from
          }>`,
          to: email,
          subject: 'Appointment modify notification',
          template: 'appointment_modified',
          ['h:X-Mailgun-Variables']: JSON.stringify(templateValue),
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentPaymentEmail(email: string, templateValue?: any) {
    try {
      //const content = new PaymentAppointmentTemplate({ amount, txnId }).html();
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: `Woofmeets no-reply <${
            this.secretService.getMailgunCreds().from
          }>`,
          to: email,
          subject: 'Appointment payment notification',
          template: 'appointment_payment_petowner',
          ['h:X-Mailgun-Variables']: JSON.stringify(templateValue),
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentPaymentForProviderEmail(email: string, templateValue?: any) {
    try {
      //const content = new PaymentAppointmentForProviderTemplate().html();
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: `Woofmeets no-reply <${
            this.secretService.getMailgunCreds().from
          }>`,
          to: email,
          subject: 'Appointment payment notification',
          template: 'appointment_payment_petsitter',
          ['h:X-Mailgun-Variables']: JSON.stringify(templateValue),
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentRejectEmail(email: string, templateValue?: any) {
    try {
      //const content = new TempAppointmentTemplate(status).html();
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: `Woofmeets no-reply <${
            this.secretService.getMailgunCreds().from
          }>`,
          to: email,
          subject: 'Appointment canceled notification',
          template: 'appointment_canceled',
          ['h:X-Mailgun-Variables']: JSON.stringify(templateValue),
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentRefundEmail(email: string, templateValue?: any) {
    try {
      //const content = new TempAppointmentTemplate(status).html();
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: `Woofmeets no-reply <${
            this.secretService.getMailgunCreds().from
          }>`,
          to: email,
          subject: 'Appointment cancelled notification',
          template: 'appointment_refunded',
          ['h:X-Mailgun-Variables']: JSON.stringify(templateValue),
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }

  async appointmentCompleteEmail(email: string, templateValue?: any) {
    try {
      //const content = new TempAppointmentTemplate(status).html();
      return this.mailgunService.createEmail(
        this.secretService.getMailgunCreds().domain,
        {
          from: `Woofmeets no-reply <${
            this.secretService.getMailgunCreds().from
          }>`,
          to: email,
          subject: 'Appointment completed notification',
          template: 'appointment_completed',
          ['h:X-Mailgun-Variables']: JSON.stringify(templateValue),
        },
      );
    } catch (error) {
      this.logger.error(error?.message);
    }
  }
}
