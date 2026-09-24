import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateFeedbackInput } from '../../common/validation/schemas';

@Injectable()
export class FeedbacksService {
  private readonly logger = new Logger(FeedbacksService.name);

  constructor(private readonly db: DatabaseService) {}

  // ──────────────────────────────────────────────────────────────
  //  CREATE FEEDBACK — POST /api/sessions/:id/feedback
  //
  //  Flujo HU-05:
  //  1. Verificar que la sesión existe y el reviewer es participante.
  //  2. Verificar que el reviewee es el OTRO participante.
  //  3. Verificar que no haya ya un feedback de este reviewer para este reviewee.
  //  4. Crear el feedback en una transacción.
  //  5. Si AMBOS participantes han dado feedback, cerrar la sesión como COMPLETED
  //     y actualizar la help_request a RESOLVED.
  // ──────────────────────────────────────────────────────────────

  async create(sessionId: string, reviewerId: string, input: CreateFeedbackInput) {
    // 1. Obtener la sesión con sus participantes y feedbacks existentes
    const session = await this.db.session.findUnique({
      where: { id: sessionId },
      select: {
        id:            true,
        hostId:        true,
        participantId: true,
        status:        true,
        requestId:     true,
        feedbacks: {
          select: { id: true, reviewerId: true, revieweeId: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session "${sessionId}" not found.`);
    }

    // 2. Solo participantes de la sesión pueden dar feedback
    const participantIds = [session.hostId, session.participantId].filter(Boolean) as string[];

    if (!participantIds.includes(reviewerId)) {
      throw new ForbiddenException('You are not a participant in this session.');
    }

    // 3. La sesión debe haber iniciado (no PENDING, no CANCELLED)
    if (session.status === 'CANCELLED') {
      throw new BadRequestException('Cannot submit feedback for a cancelled session.');
    }
    if (session.status === 'PENDING') {
      throw new BadRequestException('Cannot submit feedback for a session that has not started.');
    }

    // 4. El reviewee debe ser el OTRO participante (no puedes calificarte a ti mismo)
    if (input.revieweeId === reviewerId) {
      throw new BadRequestException('You cannot submit feedback for yourself.');
    }

    if (!participantIds.includes(input.revieweeId)) {
      throw new ForbiddenException('The reviewee is not a participant in this session.');
    }

    // 5. Verificar que no exista ya feedback de este reviewer → reviewee en esta sesión
    const alreadySubmitted = session.feedbacks.some(
      (f) => f.reviewerId === reviewerId && f.revieweeId === input.revieweeId,
    );
    if (alreadySubmitted) {
      throw new ConflictException(
        'You have already submitted feedback for this participant in this session.',
      );
    }

    // 6. Crear el feedback y, si corresponde, cerrar sesión + resolver request
    const result = await this.db.transaction(async (tx) => {
      // Crear el feedback
      const feedback = await tx.feedback.create({
        data: {
          sessionId,
          reviewerId,
          revieweeId:          input.revieweeId,
          rating:              input.rating,
          ratingCommunication: input.ratingCommunication ?? null,
          ratingKnowledge:     input.ratingKnowledge ?? null,
          ratingPunctuality:   input.ratingPunctuality ?? null,
          comment:             input.comment ?? null,
          wouldRecommend:      input.wouldRecommend,
        },
        select: {
          id: true, sessionId: true, reviewerId: true, revieweeId: true,
          rating: true, ratingCommunication: true, ratingKnowledge: true,
          ratingPunctuality: true, comment: true, wouldRecommend: true,
          createdAt: true,
          reviewer: { select: { id: true, displayName: true, username: true } },
          reviewee: { select: { id: true, displayName: true, username: true } },
        },
      });

      // ── Lógica de cierre de sesión ──────────────────────────
      // Total de feedbacks incluyendo el que acabamos de crear
      const totalFeedbacksAfter = session.feedbacks.length + 1;

      // Número de participantes activos (2 máximo en pair programming)
      const participantCount = participantIds.length; // 2
      // Feedbacks esperados: cada participante califica al otro = participantCount
      const expectedFeedbacks = participantCount;

      if (totalFeedbacksAfter >= expectedFeedbacks && session.status !== 'COMPLETED') {
        const now = new Date();

        // Calcular duración real en segundos si tenemos startedAt
        const sessionRecord = await tx.session.findUnique({
          where: { id: sessionId },
          select: { startedAt: true },
        });
        const durationSeconds = sessionRecord?.startedAt
          ? Math.floor((now.getTime() - sessionRecord.startedAt.getTime()) / 1000)
          : null;

        // Cerrar la sesión como COMPLETED
        await tx.session.update({
          where: { id: sessionId },
          data: {
            status:          'COMPLETED',
            endedAt:         now,
            durationSeconds: durationSeconds,
          },
        });

        // Marcar la help_request como RESOLVED (si existe)
        if (session.requestId) {
          await tx.helpRequest.update({
            where: { id: session.requestId },
            data: {
              status:     'RESOLVED',
              resolvedAt: now,
            },
          });
        }

        this.logger.log(
          `Session ${sessionId} completed after ${totalFeedbacksAfter} feedbacks. ` +
          `Duration: ${durationSeconds}s`,
        );
      }

      return feedback;
    });

    return result;
  }

  // ──────────────────────────────────────────────────────────────
  //  GET SESSION FEEDBACKS — GET /api/sessions/:id/feedback
  // ──────────────────────────────────────────────────────────────

  async findBySession(sessionId: string, userId: string) {
    const session = await this.db.session.findUnique({
      where: { id: sessionId },
      select: { id: true, hostId: true, participantId: true },
    });

    if (!session) throw new NotFoundException('Session not found.');

    // Solo participantes pueden ver los feedbacks
    if (session.hostId !== userId && session.participantId !== userId) {
      throw new ForbiddenException('You are not a participant in this session.');
    }

    return this.db.feedback.findMany({
      where: { sessionId },
      select: {
        id: true, rating: true, ratingCommunication: true,
        ratingKnowledge: true, ratingPunctuality: true,
        comment: true, wouldRecommend: true, createdAt: true,
        reviewer: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        reviewee: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
