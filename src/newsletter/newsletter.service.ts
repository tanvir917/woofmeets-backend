import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Mailchimp = require('mailchimp-api-v3');

@Injectable()
export class NewsletterService {
  constructor(
    private secretService: SecretService,
    private prismaService: PrismaService,
  ) {}

  async createSubcripton(createNewsletterDto: CreateNewsletterDto) {
    const { email } = createNewsletterDto;

    const mailchimp = new Mailchimp(
      this.secretService.getMailchimpCreds().apiKey,
    );
    const url = this.secretService.getMailchimpCreds().subsUrl;
    return mailchimp
      .post(url, {
        email_address: email,
        status: 'subscribed',
      })
      .then(async (result) => {
        return {
          message: 'User subscribed successfully!',
          data: result,
        };
      })
      .catch((error) => {
        if (error.status === 400 && error.title === 'Member Exists') {
          return mailchimp
            .patch(`${url}/${email}`, {
              status: 'subscribed',
            })
            .then((result) => {
              return {
                message: 'User subscribed successfully!',
                data: result,
              };
            })
            .catch((error) => {
              return {
                statusCode: error.status,
                message: error.title,
                data: error,
              };
            });
        }
        return {
          statusCode: error.status,
          message: error.title,
          data: error,
        };
      });
  }
}
