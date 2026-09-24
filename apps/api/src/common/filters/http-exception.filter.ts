import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error: string;
  requestId?: string;
}

/**
 * @class HttpExceptionFilter
 *
 * Global exception filter that handles:
 * - NestJS HttpExceptions (validation errors, 404s, 403s, etc.)
 * - Prisma client errors (unique constraints, not found, etc.)
 * - Unhandled errors (returns 500)
 *
 * Produces a consistent JSON error response format.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request.headers['x-request-id'] as string) ?? 'unknown';
    const path = request.url;
    const method = request.method;

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    // ── HttpException (NestJS built-in) ──────────────────────────
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res['message'] as string | string[]) ?? message;
        error = (res['error'] as string) ?? exception.name;
      }
    }

    // ── Prisma Errors ─────────────────────────────────────────────
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const { statusCode: s, message: m, error: e } = this.handlePrismaError(exception);
      statusCode = s;
      message = m;
      error = e;
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided to database operation.';
      error = 'Database Validation Error';
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      statusCode = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database connection unavailable.';
      error = 'Database Unavailable';
    }

    // ── Generic Error ─────────────────────────────────────────────
    else if (exception instanceof Error) {
      // Don't expose internal error messages in production
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message;
      }
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path,
      method,
      message,
      error,
      requestId,
    };

    // ── Log the Exception ─────────────────────────────────────────
    if (statusCode >= 500) {
      this.logger.error(
        `[${requestId}] ${method} ${path} → ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
        HttpExceptionFilter.name,
      );
    } else {
      this.logger.warn(
        `[${requestId}] ${method} ${path} → ${statusCode}: ${JSON.stringify(message)}`,
        HttpExceptionFilter.name,
      );
    }

    response.status(statusCode).json(errorResponse);
  }

  // ── Prisma Error Code Mapping ──────────────────────────────────

  private handlePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): { statusCode: number; message: string; error: string } {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const fields = (error.meta?.['target'] as string[])?.join(', ') ?? 'field';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${fields} already exists.`,
          error: 'Conflict',
        };
      }
      case 'P2025':
        // Record not found
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'The requested record was not found.',
          error: 'Not Found',
        };
      case 'P2003':
        // Foreign key constraint violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Related record not found. Check associated IDs.',
          error: 'Bad Request',
        };
      case 'P2014':
        // Required relation violation
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'The operation violates a required relation constraint.',
          error: 'Bad Request',
        };
      case 'P1001':
      case 'P1002':
        // Database unreachable / timeout
        return {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message: 'Database is currently unavailable. Please try again later.',
          error: 'Service Unavailable',
        };
      default:
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'A database error occurred.',
          error: 'Internal Server Error',
        };
    }
  }
}
