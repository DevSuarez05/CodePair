import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../../database/database.service';
import {
  CreateHelpRequestInput,
  HelpRequestFilterInput,
} from '../../common/validation/schemas';
import { PaginatedResult } from '../../domain/types/domain.types';

// ─── Standard select for list views ──────────────────────────

const requestListSelect = {
  id: true,
  title: true,
  description: true,
  language: true,
  status: true,
  priority: true,
  estimatedMinutes: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: { id: true, displayName: true, username: true, avatarUrl: true },
  },
  mentor: {
    select: { id: true, displayName: true, username: true, avatarUrl: true },
  },
  skills: {
    select: { skill: { select: { id: true, name: true, slug: true, category: true } } },
  },
} as const;

// ─── Detail select (adds code snippet and session link) ───────

const requestDetailSelect = {
  ...requestListSelect,
  codeSnippet:      true,
  errorMessage:     true,
  acceptedAt:       true,
  resolvedAt:       true,
  session: {
    select: {
      id: true, roomCode: true, status: true,
      meetLink: true,
      startedAt: true,
    },
  },
} as const;

@Injectable()
export class HelpRequestsService {
  private readonly logger = new Logger(HelpRequestsService.name);

  constructor(private readonly db: DatabaseService) {}

  // ──────────────────────────────────────────────────────────────
  //  CREATE — POST /api/requests
  // ──────────────────────────────────────────────────────────────

  async create(input: CreateHelpRequestInput, studentId: string) {
    // 1. Verificar que el skill existe y está activo
    const skill = await this.db.skill.findUnique({
      where: { id: input.skillId, isActive: true },
      select: { id: true, name: true },
    });
    if (!skill) {
      throw new NotFoundException(`Skill with ID "${input.skillId}" not found or inactive.`);
    }

    // 2. Verificar que el estudiante no tenga ya una solicitud OPEN para el mismo skill
    const existingOpen = await this.db.helpRequest.findFirst({
      where: {
        studentId,
        status: 'OPEN',
        skills: { some: { skillId: input.skillId } },
      },
      select: { id: true },
    });
    if (existingOpen) {
      throw new BadRequestException(
        `You already have an open request for skill "${skill.name}". ` +
        `Please resolve or cancel it before creating a new one.`,
      );
    }

    // 3. Calcular expiración por defecto si no se proveyó (48 horas)
    const expiresAt = input.expiresAt
      ? new Date(input.expiresAt)
      : new Date(Date.now() + 48 * 60 * 60 * 1000);

    // 4. Crear la solicitud con la skill vinculada
    const request = await this.db.helpRequest.create({
      data: {
        studentId,
        title:            input.title,
        description:      input.description,
        codeSnippet:      input.codeSnippet ?? null,
        errorMessage:     input.errorMessage ?? null,
        language:         input.language,
        priority:         input.priority,
        estimatedMinutes: input.estimatedMinutes ?? null,
        expiresAt,
        skills: {
          create: [{ skillId: input.skillId }],
        },
      },
      select: requestDetailSelect,
    });

    this.logger.log(`Help request created: ${request.id} by student ${studentId}`);
    return request;
  }

  // ──────────────────────────────────────────────────────────────
  //  FEED — GET /api/requests (dinámico con filtros + paginación)
  // ──────────────────────────────────────────────────────────────

  async findAll(filter: HelpRequestFilterInput): Promise<PaginatedResult<unknown>> {
    const { page, limit, skillId, language, status, priority } = filter;
    const skip = (page - 1) * limit;

    // Construir where dinámicamente
    const where: Prisma.HelpRequestWhereInput = {
      deletedAt: undefined, // No existe soft-delete en requests, pero preparado
    };

    // Filtros opcionales
    if (status)   where.status   = status;
    if (priority) where.priority = priority;
    if (language) where.language = language;

    // Filtro por skill (join a través de HelpRequestSkill)
    if (skillId) {
      where.skills = { some: { skillId } };
    }

    // Solo mostrar requests no expiradas en el feed público
    if (!status) {
      where.status = { in: ['OPEN', 'IN_PROGRESS'] };
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    const [total, data] = await Promise.all([
      this.db.helpRequest.count({ where }),
      this.db.helpRequest.findMany({
        where,
        select: requestListSelect,
        orderBy: [
          { priority: 'desc' },   // CRITICAL primero
          { createdAt: 'desc' },  // Más recientes después
        ],
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  // ──────────────────────────────────────────────────────────────
  //  FIND ONE — GET /api/requests/:id
  // ──────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const request = await this.db.helpRequest.findUnique({
      where: { id },
      select: requestDetailSelect,
    });
    if (!request) throw new NotFoundException('Help request not found.');
    return request;
  }

  // ──────────────────────────────────────────────────────────────
  //  CANCEL — PATCH /api/requests/:id/cancel
  // ──────────────────────────────────────────────────────────────

  async cancel(id: string, studentId: string) {
    const request = await this.db.helpRequest.findUnique({
      where: { id },
      select: { id: true, studentId: true, status: true },
    });

    if (!request) throw new NotFoundException('Help request not found.');

    if (request.studentId !== studentId) {
      throw new ForbiddenException('You can only cancel your own requests.');
    }

    if (!['OPEN', 'EXPIRED'].includes(request.status)) {
      throw new BadRequestException(
        `Cannot cancel a request with status "${request.status}".`,
      );
    }

    return this.db.helpRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
      select: requestDetailSelect,
    });
  }
}
