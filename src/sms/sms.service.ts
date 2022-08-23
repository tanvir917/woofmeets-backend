import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SecretService } from 'src/secret/secret.service';
import { Twilio } from 'twilio';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

@Injectable()
export class SmsService {
  static client: Twilio;
  #phone: string;

  constructor(
    private readonly secretService: SecretService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SmsService.name);

    const { number, sid, token } = this.secretService.getTwilioCreds();

    this.#phone = number;
    if (SmsService.client === undefined) {
      SmsService.client = new Twilio(sid, token);
    }
  }

  // https://www.twilio.com/blog/send-scheduled-sms-node-js-twilio
  // https://www.twilio.com/docs/libraries/node/usage-guide#exceptions
  /**
   *
   * @param phoneNumber - the target phone number
   * @param message - the text message itself
   * @returns {Promise<[MessageInstance | undefined, any]>} - The target response is an array of 2 elements
   * a[0] -> the api response
   * a[1] -> the error message
   */
  async sendText(
    phoneNumber: string,
    message: string,
  ): Promise<[MessageInstance | undefined, any]> {
    let response: MessageInstance;
    let error: any;

    try {
      response = await SmsService.client.messages.create({
        from: this.#phone,
        to: phoneNumber,
        body: message,
      });
    } catch (err) {
      error = err;
      this.logger.error(error);
    }

    return [response, error];
  }
}
