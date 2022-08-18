import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { PinoLogger } from 'nestjs-pino';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SecretService } from 'src/secret/secret.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly secretService: SecretService,
    private readonly logger: PinoLogger,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secretService.getJwtCreds().jwtSecret,
    });
  }

  async validate(payload: any) {
    // console.log('Got payload', payload);
    this.logger.assign({
      user: {
        email: payload?.email,
        opk: payload?.opk,
        id: payload?.id,
      },
    });
    return payload;
  }
}
