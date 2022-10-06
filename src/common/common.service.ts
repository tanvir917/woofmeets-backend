import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { customAlphabet } from 'nanoid';
import { SecretService } from 'src/secret/secret.service';

@Injectable()
export class CommonService {
  constructor(
    private configService: ConfigService,
    private secretService: SecretService,
  ) {}

  getToken() {
    const tokenString = this.secretService.getRndTokenString();
    const tokenLength = this.configService.get('RND_TOKEN_LENGTH');
    let token = '';
    const strLength = tokenString.length;
    for (let i = 0; i < parseInt(tokenLength); i++) {
      token += tokenString[Math.floor(Math.random() * strLength)];
    }
    return token;
  }

  getSlug(slug: string) {
    return slug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  getOpk() {
    const nanoid = customAlphabet(
      this.secretService.getRndTokenString(),
      this.secretService.getOpkLength(),
    );

    return nanoid();
  }

  getInvoiceNumber() {
    const nanoid = customAlphabet(
      this.secretService.getRndTokenString(),
      this.secretService.getAppointmentCreds().invoiceNumberLength,
    );

    return nanoid();
  }

  getOtp() {
    const code = customAlphabet('1234567890', 6);
    return code();
  }

  static checkAllowedMimeType(mimeType: string): boolean {
    const allowed = {
      'image/gif': true,
      'image/png': true,
      'application/pdf': true,
      'image/tiff': true,
      'text/csv': true,
      'text/css': true,
      'image/bmp': true,
      'image/webp': true,
      'video/webm': true,
      'text/html': true,
      'image/jpeg': true,
    };

    const result = allowed?.[mimeType] ?? false;

    if (!result) console.error(`${mimeType} not allowed`);

    return result;
  }
}
