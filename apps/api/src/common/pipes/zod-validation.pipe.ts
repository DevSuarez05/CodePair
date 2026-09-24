import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/**
 * @pipe ZodValidationPipe
 *
 * Pipe genérico para validar payloads con esquemas Zod.
 * Lanza BadRequestException con todos los errores de validación
 * formateados de manera legible.
 *
 * @example
 * @Body(new ZodValidationPipe(registerSchema))
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = this.formatErrors(result.error);
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    return result.data;
  }

  private formatErrors(error: ZodError): Record<string, string[]> {
    return error.issues.reduce<Record<string, string[]>>((acc, issue) => {
      const path = issue.path.join('.') || 'root';
      if (!acc[path]) acc[path] = [];
      acc[path].push(issue.message);
      return acc;
    }, {});
  }
}
