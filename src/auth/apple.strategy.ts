import { Strategy } from '@arendajaelu/nestjs-passport-apple';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('APPLE_CLIENTID'),
      teamID: config.get<string>('APPLE_TEAMID'),
      keyID: config.get<string>('APPLE_KEYID'),
      keyFilePath: config.get<string>('APPLE_KEYFILE_PATH'),
      callbackURL: config.get<string>('APPLE_CALLBACK'),
      passReqToCallback: false,
      scope: ['email', 'name'],
    });
  }
}
