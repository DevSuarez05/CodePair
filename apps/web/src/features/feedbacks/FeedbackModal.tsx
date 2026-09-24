'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Award,
  ThumbsUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { StarRating } from '@/components/ui/StarRating';
import {
  createFeedbackSchema,
  CreateFeedbackFormData,
} from '@/lib/validations';
import apiClient from '@/lib/api-client';
import type { Session } from '@/types/api.types';

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  onSuccess?: () => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: FeedbackModalProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Determinar a quién se califica (el compañero de la sesión)
  const reviewee = session?.participant || session?.host;
  const revieweeName = reviewee?.displayName || reviewee?.username || 'tu compañero de sesión';
  const revieweeInitials = revieweeName.slice(0, 2).toUpperCase();

  const {
    handleSubmit,
    control,
    register,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFeedbackFormData>({
    resolver: zodResolver(createFeedbackSchema),
    defaultValues: {
      sessionId: session?.id || '',
      revieweeId: reviewee?.id || '',
      rating: 5,
      ratingCommunication: 5,
      ratingKnowledge: 5,
      ratingPunctuality: 5,
      comment: '',
      wouldRecommend: true,
    },
  });

  const commentText = watch('comment') || '';
  const wouldRecommend = watch('wouldRecommend');

  // Actualizar valores si cambia la sesión
  React.useEffect(() => {
    if (session && reviewee) {
      setValue('sessionId', session.id);
      setValue('revieweeId', reviewee.id);
    }
  }, [session, reviewee, setValue]);

  const onSubmit = async (data: CreateFeedbackFormData) => {
    setServerError(null);
    try {
      if (session) {
        await apiClient.post(`/sessions/${session.id}/feedback`, {
          revieweeId: data.revieweeId,
          rating: data.rating,
          ratingCommunication: data.ratingCommunication,
          ratingKnowledge: data.ratingKnowledge,
          ratingPunctuality: data.ratingPunctuality,
          comment: data.comment,
          wouldRecommend: data.wouldRecommend,
        });
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        reset();
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Error al enviar la calificación. Inténtalo nuevamente.';
      setServerError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Award className="h-5 w-5" />
          </div>
          <span>Calificar Sesión de Pair Programming</span>
        </div>
      }
      description="Tu feedback ayuda a mantener una comunidad técnica de alta calidad y reconocimiento mutuo"
    >
      {/* Alerta de error */}
      {serverError && (
        <div className="mb-4 rounded-lg bg-red-950/60 border border-red-500/40 p-3.5 text-xs text-red-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold">Error al enviar feedback</p>
            <p className="text-red-300/90 mt-0.5">{serverError}</p>
          </div>
        </div>
      )}

      {/* Alerta de éxito */}
      {isSuccess && (
        <div className="mb-4 rounded-lg bg-emerald-950/60 border border-emerald-500/40 p-3.5 text-xs text-emerald-300 flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold">¡Calificación registrada con éxito!</p>
            <p className="text-emerald-300/90">
              Gracias por impulsar el crecimiento de la comunidad.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Tarjeta de Compañero a Calificar */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-surface-100/70 p-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-purple text-sm font-bold text-white shadow-md">
            {revieweeInitials}
          </div>
          <div>
            <p className="text-xs text-slate-400">Estás calificando a:</p>
            <h4 className="text-sm font-bold text-white">{revieweeName}</h4>
          </div>
        </div>

        {/* 1. Selector Interactivo de Estrellas General (1 a 5) */}
        <div className="rounded-xl border border-slate-800 bg-surface-100/50 p-4 space-y-2">
          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              <StarRating
                label="Calificación General de la Sesión *"
                value={field.value}
                onChange={field.onChange}
                size="lg"
                error={errors.rating?.message}
              />
            )}
          />
        </div>

        {/* 2. Criterios de Evaluación Específicos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-800/80 bg-surface-100/40 p-3">
            <Controller
              name="ratingCommunication"
              control={control}
              render={({ field }) => (
                <StarRating
                  label="Comunicación"
                  value={field.value || 5}
                  onChange={field.onChange}
                  size="sm"
                  showLabel={false}
                />
              )}
            />
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-surface-100/40 p-3">
            <Controller
              name="ratingKnowledge"
              control={control}
              render={({ field }) => (
                <StarRating
                  label="Conocimiento"
                  value={field.value || 5}
                  onChange={field.onChange}
                  size="sm"
                  showLabel={false}
                />
              )}
            />
          </div>

          <div className="rounded-lg border border-slate-800/80 bg-surface-100/40 p-3">
            <Controller
              name="ratingPunctuality"
              control={control}
              render={({ field }) => (
                <StarRating
                  label="Puntualidad"
                  value={field.value || 5}
                  onChange={field.onChange}
                  size="sm"
                  showLabel={false}
                />
              )}
            />
          </div>
        </div>

        {/* 3. Textarea de Comentarios y Recomendación */}
        <Textarea
          label="Comentarios & Retroalimentación Constructiva *"
          placeholder="Describe cómo fue la sesión, qué soluciones encontraron y qué fortalezas destacas de tu compañero..."
          rows={4}
          error={errors.comment?.message}
          charCount={{ current: commentText.length, max: 2000 }}
          {...register('comment')}
        />

        {/* 4. Switch ¿Recomendarías trabajar juntos? */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-surface-100/40 p-3.5">
          <div className="flex items-center gap-2.5">
            <ThumbsUp className="h-4 w-4 text-emerald-400" />
            <div>
              <p className="text-xs font-semibold text-slate-200">
                ¿Recomendarías programar con este desarrollador?
              </p>
              <p className="text-[11px] text-slate-500">
                Aparecerá en el porcentaje de recomendación de su perfil
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={wouldRecommend}
            onClick={() => setValue('wouldRecommend', !wouldRecommend)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              wouldRecommend ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                wouldRecommend ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="glow"
            size="md"
            isLoading={isSubmitting}
            className="font-semibold px-6 text-xs"
          >
            Enviar Calificación
          </Button>
        </div>
      </form>
    </Modal>
  );
}
