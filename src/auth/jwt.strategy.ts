import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request as RequestType } from 'express';
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
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJWT,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: secretService.getJwtCreds().jwtSecret,
    });
  }

  private static extractJWT(req: RequestType): string | null {
    if (
      req?.cookies &&
      'token' in req?.cookies &&
      req?.cookies?.token?.length > 0
    ) {
      return req.cookies.token;
    }
    return null;
  }

  async validate(payload: any) {
    this.logger.assign({
      user: {
        email: payload?.email,
        opk: payload?.opk,
        provider: payload?.provider,
        id: payload?.id,
      },
    });
    return payload;
  }
}
