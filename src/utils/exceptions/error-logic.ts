import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

const throwErrorIfCaseIsTrue = (logic: boolean, error: HttpException) => {
  if (logic) {
    throw error;
  }
};

/**
 *
 * @param condition - if true an error will throw
 * @param message - error message
 * @returns
 */
export const throwForbiddenErrorCheck = (condition: boolean, message: string) =>
  throwErrorIfCaseIsTrue(condition, new ForbiddenException(message));

/**
 *
 * @param condition - if true an error will throw
 * @param message - error message
 * @returns
 */
export const throwNotFoundErrorCheck = (condition: boolean, message: string) =>
  throwErrorIfCaseIsTrue(condition, new NotFoundException(message));

/**
 * @param condition - if true an error will throw
 * @param message - error message
 * @param log - log message
 * @returns
 */
export const throwBadRequestErrorCheck = (
  condition: boolean,
  message: string,
  log?: string,
) => {
  // console.log(log ?? message);
  throwErrorIfCaseIsTrue(condition, new BadRequestException(message));
};

/**
 *
 * @param condition - if true an error will throw
 * @param message - error message
 * @param log - log message
 * @returns
 */
export const throwConflictErrorCheck = (
  condition: boolean,
  message: string,
  log?: string,
) => {
  // console.log(log ?? message);
  throwErrorIfCaseIsTrue(condition, new ConflictException(message));
};

/**
 *
 * @param condition - if true an error will throw
 * @param message - error message
 * @param log - log message
 * @returns
 */
export const throwServerErrorCheck = (
  condition: boolean,
  message: string,
  log?: string,
) => {
  console.log(log ?? message);
  throwErrorIfCaseIsTrue(condition, new InternalServerErrorException(message));
};

/**
 * @param condition - if true an error will throw
 * @param message - error message
 * @param log - log message
 * @returns
 */
export const throwInternalServerErrorCheck = (
  condition: boolean,
  message: string,
  log?: string,
) => {
  log && console.log(log);
  throwErrorIfCaseIsTrue(condition, new InternalServerErrorException(message));
};

/**
 * @param condition - if true an error will throw
 * @param message - error message
 * @param log - log message
 * @returns
 */
export const throwUnauthorizedErrorCheck = (
  condition: boolean,
  message: string,
  log?: string,
) => {
  log && console.log(log);
  throwErrorIfCaseIsTrue(condition, new UnauthorizedException(message));
};
