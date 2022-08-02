import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SecretService } from './secret/secret.service';
import { PrismaService } from './prisma/prisma.service';
import { LoggerModule } from 'nestjs-pino';
import { SecretModule } from './secret/secret.module';
import { GlobalModule } from './global/global.module';
import { SwaggerModule } from '@nestjs/swagger';
import {
  ASYNC_LOGGER_CONFIG,
  validateEnvironmentVariables,
} from './global/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateEnvironmentVariables,
      isGlobal: true,
      envFilePath: '.env',
    }),
    SecretModule,
    LoggerModule.forRootAsync(ASYNC_LOGGER_CONFIG),
    SwaggerModule,
    GlobalModule,
  ],
  controllers: [AppController],
  providers: [AppService, SecretService, PrismaService],
})
export class AppModule {}
