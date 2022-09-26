import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from 'src/common/common.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { SecretService } from 'src/secret/secret.service';
import { ZoomController } from './zoom.controller';
import { ZoomService } from './zoom.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [SecretModule],
      inject: [SecretService],
      useFactory: async (secretService: SecretService) => {
        return {
          secret: secretService.getZoomJwtCreds().jwtSecret,
        };
      },
    }),
    HttpModule,
    PrismaModule,
    SecretModule,
    CommonModule,
  ],
  controllers: [ZoomController],
  providers: [ZoomService],
})
export class ZoomModule {}
