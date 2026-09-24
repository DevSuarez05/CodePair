import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  requestId?: string;
}

/**
 * @class ResponseInterceptor
 *
 * Wraps all successful controller responses in a standardized envelope:
 * {
 *   "success": true,
 *   "data": { ... },
 *   "timestamp": "...",
 *   "requestId": "..."
 * }
 *
 * This keeps the API contract consistent across all endpoints.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.headers['x-request-id'] as string | undefined;

    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId }),
      })),
    );
  }
}
