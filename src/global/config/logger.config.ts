import { ConfigService } from '@nestjs/config';
import { LoggerModuleAsyncParams } from 'nestjs-pino';
import path from 'path';
import pino from 'pino';
import { createStream } from 'rotating-file-stream';

const pad = (num: number) => (num > 9 ? '' : '0') + num;

//https://www.npmjs.com/package/rotating-file-stream#:~:text=An%20example%20of%20a%20complex%20rotated%20file%20name%20generator%20function%20could%20be%3A
const generator =
  (target: 'info' | 'error' = 'error') =>
  (time?: Date, index?: number): string => {
    if (!time) return 'error.log';

    const yearAndMonth = time.getFullYear() + '_' + pad(time.getMonth() + 1);
    const day = pad(time.getDate());

    return `${target}/${target}_${yearAndMonth}_${day}_${index ?? 1}.log`;
  };

export const ASYNC_LOGGER_CONFIG: LoggerModuleAsyncParams = {
  useFactory: async (configService: ConfigService) => {
    const loglevel = configService.get<
      'debug' | 'info' | 'warn' | 'error' | 'fatal'
    >('LOG_LEVEL', 'info');

    return {
      renameContext: configService.get<string>('CONTEXT', 'Woofmeets'),
      pinoHttp: {
        redact: ['*.headers'],
        customLogLevel: function (req, res, err) {
          if ((res.statusCode >= 400 && res.statusCode >= 500) || err) {
            return 'error';
          } else if (res.statusCode >= 300 && res.statusCode < 400) {
            return 'silent';
          }
          return 'info';
        },
        level: loglevel,
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  translateTime: 'SYS:standard',
                },
              }
            : undefined,
        stream: pino.multistream([
          {
            level: 'error',
            stream: createStream(generator('error'), {
              path: `${path.join(__dirname, '..', '..', '..', 'logs')}`,
              interval: '1d',
              intervalBoundary: true,
              initialRotation: true,
              immutable: true,
            }),
          },
          (process.env.STORE_INFO_LOGS || false) && {
            level: 'info',
            stream: createStream(generator('info'), {
              path: `${path.join(__dirname, '..', '..', '..', 'logs')}`,
              interval: '1d',
              intervalBoundary: true,
              initialRotation: true,
              immutable: true,
            }),
          },
          { level: loglevel, stream: process.stdout },
        ]),
      },
    };
  },
  inject: [ConfigService],
};
