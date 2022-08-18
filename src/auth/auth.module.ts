import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from 'src/common/common.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { SecretService } from 'src/secret/secret.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { PasswordService } from './password.service';

@Module({
  imports: [
    SecretModule,
    PrismaModule,
    CommonModule,
    JwtModule.registerAsync({
      imports: [SecretModule],
      inject: [SecretService],
      useFactory: async (secretService: SecretService) => {
        return {
          secret: secretService.getJwtCreds().jwtSecret,
          signOptions: { expiresIn: secretService.getJwtCreds().jwtExpire },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PasswordService],
})
export class AuthModule {}
