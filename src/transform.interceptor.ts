import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> | Promise<Observable<Response<T>>> {
    return next.handle().pipe(
      map((data) => ({
        statusCode:
          data?.status ??
          data?.statusCode ??
          context.switchToHttp().getResponse().statusCode,
        message: data?.message ?? 'Request processed successfully.',
        data: data?.data ?? null,
        meta: data?.meta,
      })),
    );
  }
}
