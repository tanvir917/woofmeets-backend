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
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { FileModule } from './file/file.module';
import { AwsModule } from './aws/aws.module';

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
    PrismaModule,
    CommonModule,
    FileModule,
    AwsModule,
  ],
  controllers: [AppController],
  providers: [AppService, SecretService, PrismaService],
})
export class AppModule {}
