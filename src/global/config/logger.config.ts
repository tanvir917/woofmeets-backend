import { ConfigService } from '@nestjs/config';
import { LoggerModuleAsyncParams } from 'nestjs-pino';
import { SecretModule } from 'src/secret/secret.module';
import { SecretService } from 'src/secret/secret.service';

export const ASYNC_LOGGER_CONFIG: LoggerModuleAsyncParams = {
  useFactory: async (configService: ConfigService) => {
    return {
      renameContext: configService.get<string>('CONTEXT', 'Woofmeets'),
      pinoHttp: {
        redact: ['*.headers'],
        level: configService.get<'debug' | 'info' | 'warn' | 'error' | 'fatal'>(
          'LOG_LEVEL',
          'info',
        ),
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  translateTime: 'SYS:standard',
                },
              }
            : undefined,
        transports: [],
      },
    };
  },
  inject: [ConfigService],
};
