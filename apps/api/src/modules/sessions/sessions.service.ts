import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../database/database.service';

// ─── Jitsi Meet URL generator ──────────────────────────────────

/**
 * Genera un enlace único a Jitsi Meet para la sesión.
 * Formato: https://meet.jit.si/codepair-{uuid}
 *
 * El roomId es determinístico basado en el sessionId para
 * que ambos participantes accedan a la misma sala.
 */
function generateMeetLink(sessionId: string): string {
  return `https://meet.jit.si/codepair-${sessionId}`;
}

/**
 * Genera un código corto alfanumérico de 8 caracteres para unirse a la sesión.
 */
function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ─── Select Fields ─────────────────────────────────────────────

const sessionDetailSelect = {
  id: true,
  requestId: true,
  hostId: true,
  participantId: true,
  title: true,
  language: true,
  status: true,
  roomCode: true,
  meetLink: true,
  isPrivate: true,
  scheduledAt: true,
  startedAt: true,
  endedAt: true,
  durationSeconds: true,
  createdAt: true,
  updatedAt: true,
  host: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
  participant: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
  helpRequest: {
    select: {
      id: true, title: true, status: true,
      skills: { select: { skill: { select: { id: true, name: true } } } },
    },
  },
} as const;

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private readonly db: DatabaseService) {}

  // ──────────────────────────────────────────────────────────────
  //  ACCEPT REQUEST — POST /api/requests/:id/accept
  //
  //  TRANSACCIÓN ACID CON SELECT FOR UPDATE (optimistic lock)
  //
  //  Problema de concurrencia:
  //  Si dos mentores envían POST /requests/:id/accept simultáneamente,
  //  sin protección ambos leerían status='OPEN' y crearían dos sesiones.
  //
  //  Solución implementada:
  //  1. Transacción serializable con rawSQL SELECT ... FOR UPDATE
  //     que adquiere un lock exclusivo de fila en la tabla help_requests.
  //  2. Re-verificación del estado DENTRO de la transacción (después del lock).
  //  3. Si el estado ya no es OPEN (otro mentor ganó la carrera),
  //     se lanza ConflictException 409.
  //  4. Todo ocurre en una sola transacción atómica:
  //     a) Lock de la fila help_request
  //     b) Update status → IN_PROGRESS + mentorId + acceptedAt
  //     c) Create session con meetLink único
  //  5. Si la transacción falla, MySQL hace ROLLBACK automático.
  // ──────────────────────────────────────────────────────────────

  async acceptRequest(requestId: string, mentorId: string) {
    // Verificar que el mentor no sea el mismo que el estudiante
    const request = await this.db.helpRequest.findUnique({
      where: { id: requestId },
      select: { id: true, studentId: true, status: true, title: true, language: true },
    });

    if (!request) {
      throw new NotFoundException(`Help request "${requestId}" not found.`);
    }

    if (request.studentId === mentorId) {
      throw new ForbiddenException('You cannot accept your own help request.');
    }

    // Verificar que el mentor tenga role MENTOR
    const mentor = await this.db.user.findUnique({
      where: { id: mentorId },
      select: { id: true, role: true },
    });

    if (!mentor || mentor.role === 'STUDENT') {
      throw new ForbiddenException('Only users with MENTOR or ADMIN role can accept requests.');
    }

    // ── TRANSACCIÓN ACID con SELECT FOR UPDATE ─────────────────
    // Aislamiento SERIALIZABLE + lock de fila para eliminar
    // la condición de carrera entre mentores concurrentes.
    const session = await this.db.transaction(
      async (tx) => {
        // PASO 1: Adquirir lock exclusivo de fila.
        // Ninguna otra transacción puede leer ni modificar esta fila
        // hasta que esta transacción termine (commit o rollback).
        const [lockedRequest] = await tx.$queryRaw<Array<{
          id: string;
          status: string;
          mentorId: string | null;
        }>>`
          SELECT id, status, mentorId
          FROM help_requests
          WHERE id = ${requestId}
          FOR UPDATE
        `;

        if (!lockedRequest) {
          throw new NotFoundException('Help request disappeared during transaction.');
        }

        // PASO 2: Re-verificar el estado DESPUÉS del lock.
        // Esto captura el caso donde otro mentor ya aceptó
        // mientras esta transacción esperaba el lock.
        if (lockedRequest.status !== 'OPEN') {
          throw new ConflictException(
            `This request is no longer available. Current status: "${lockedRequest.status}". ` +
            `Another mentor may have accepted it just now.`,
          );
        }

        // PASO 3: Generar IDs únicos
        const sessionId = uuidv4();
        const roomCode  = generateRoomCode();
        const meetLink  = generateMeetLink(sessionId);
        const now       = new Date();

        // PASO 4: Actualizar la solicitud (status + mentorId + acceptedAt)
        await tx.helpRequest.update({
          where: { id: requestId },
          data: {
            status:     'IN_PROGRESS',
            mentorId,
            acceptedAt: now,
          },
        });

        // PASO 5: Crear la sesión vinculada
        // UNIQUE constraint unique_request_session (requestId) garantiza
        // que solo se cree una sesión por solicitud (segunda línea de defensa).
        const createdSession = await tx.session.create({
          data: {
            id:            sessionId,
            requestId,
            hostId:        mentorId,
            participantId: request.studentId,
            title:         `Session: ${request.title}`,
            language:      request.language,
            roomCode,
            meetLink,
            status:        'PENDING',
            isPrivate:     false,
            startedAt:     now,
          },
          select: sessionDetailSelect,
        });

        return createdSession;
      },
      {
        // Aislamiento SERIALIZABLE: máxima protección contra condiciones de carrera
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000, // 10 segundos máximo
        maxWait: 5000,  // 5 segundos de espera para adquirir la transacción
      },
    );

    this.logger.log(
      `Request ${requestId} accepted by mentor ${mentorId}. ` +
      `Session: ${session.id} | Room: ${session.roomCode} | Meet: ${session.meetLink}`,
    );

    return session;
  }

  // ──────────────────────────────────────────────────────────────
  //  FIND SESSION — GET /api/sessions/:id
  // ──────────────────────────────────────────────────────────────

  async findOne(sessionId: string, userId: string) {
    const session = await this.db.session.findUnique({
      where: { id: sessionId },
      select: sessionDetailSelect,
    });

    if (!session) throw new NotFoundException('Session not found.');

    // Solo los participantes pueden ver el detalle completo
    if (session.hostId !== userId && session.participantId !== userId) {
      throw new ForbiddenException('You are not a participant in this session.');
    }

    return session;
  }

  // ──────────────────────────────────────────────────────────────
  //  MY SESSIONS — GET /api/sessions
  // ──────────────────────────────────────────────────────────────

  async findMySessions(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.db.session.count({
        where: { OR: [{ hostId: userId }, { participantId: userId }] },
      }),
      this.db.session.findMany({
        where: { OR: [{ hostId: userId }, { participantId: userId }] },
        select: sessionDetailSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
    };
  }
}
