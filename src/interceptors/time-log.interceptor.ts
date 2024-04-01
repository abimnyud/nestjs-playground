import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class TimeLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeLogInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startDate = Date.now();

    const http = context.switchToHttp();
    const request = http.getRequest();
    const url = request.url;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startDate;
        this.logger.log(`${url} - ${duration}ms`);
      }),
    );
  }
}
