import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';
import { globalValidationPipe } from './global/error';
import { SecretService } from './secret/secret.service';
import cookieParser from 'cookie-parser';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const cloneBuffer = require('clone-buffer');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const secretService = app.get(SecretService);

  // setup logger
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.flushLogs();

  app.use(cookieParser());

  app.use(
    json({
      verify: (req: any, res, buf, encoding) => {
        // important to store rawBody for Stripe signature verification
        if (req.headers['stripe-signature'] && Buffer.isBuffer(buf)) {
          req.rawBody = cloneBuffer(buf);
        }
        return true;
      },
    }),
  );

  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  // end setup logger

  // enable api versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  // ended enabling versioning

  // enable cors
  app.enableCors({
    origin: function (_, callback) {
      callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  // ended enable cors

  // add global validators
  app.useGlobalPipes(globalValidationPipe);

  // setup swagger
  const config = new DocumentBuilder()
    .setTitle(`Woofmeets Server ${process.env.NODE_ENV.toUpperCase()}`)
    .setDescription('You can use these apis to interact with the server')
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: `[just text field] Please enter token in following format: Bearer <JWT>`,
        name: 'Authorization',
        bearerFormat: 'Bearer',
        scheme: 'Bearer',
        type: 'http',
        in: 'Header',
      },
      'access-token',
    )
    .build();
  // ended setting up swagger

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = secretService.getPort();

  await app.listen(port);

  logger.debug(`Server running on port http://localhost:${port}`);
}

// helps parse and respond with Bigint values
BigInt.prototype['toJSON'] = function () {
  return parseInt(this.toString());
};

bootstrap();
