import { Logger } from '@nestjs/common';
import * as winston from 'winston';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

/**
 * @class WinstonLogger
 *
 * Structured logger wrapping Winston, compatible with NestJS Logger interface.
 * - Development: Pretty-printed with colors
 * - Production: JSON structured output (for log aggregators like Datadog, CloudWatch)
 */
export class WinstonLogger extends Logger {
  private readonly winstonLogger: winston.Logger;

  private constructor(winstonLogger: winston.Logger) {
    super();
    this.winstonLogger = winstonLogger;
  }

  static create(): WinstonLogger {
    const isProd = process.env.NODE_ENV === 'production';
    const logLevel = process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug');

    const devFormat = combine(
      colorize({ all: true }),
      timestamp({ format: 'HH:mm:ss' }),
      errors({ stack: true }),
      printf(({ timestamp, level, message, context, stack }) => {
        const ctx = context ? ` [${String(context)}]` : '';
        const trace = stack ? `\n${String(stack)}` : '';
        return `${String(timestamp)} ${level}${ctx}: ${String(message)}${trace}`;
      }),
    );

    const prodFormat = combine(
      timestamp(),
      errors({ stack: true }),
      json(),
    );

    const winstonLogger = winston.createLogger({
      level: logLevel,
      format: isProd ? prodFormat : devFormat,
      defaultMeta: { service: 'codepair-api' },
      transports: [
        new winston.transports.Console(),
        // In production, add file transports or cloud integrations here
        ...(isProd
          ? [
              new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
              new winston.transports.File({ filename: 'logs/combined.log' }),
            ]
          : []),
      ],
    });

    return new WinstonLogger(winstonLogger);
  }

  log(message: string, context?: string): void {
    this.winstonLogger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.winstonLogger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.winstonLogger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.winstonLogger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.winstonLogger.verbose(message, { context });
  }
}
