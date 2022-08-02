import {
  UnprocessableEntityException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export const globalValidationPipe = new ValidationPipe({
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: (errors: ValidationError[]) => {
    const messages = {};

    errors.forEach((obj) => {
      messages[obj.property] = obj.constraints[Object.keys(obj.constraints)[0]];
    });

    throw new UnprocessableEntityException({
      messages,
      statusCode: 422,
    });
  },
});
