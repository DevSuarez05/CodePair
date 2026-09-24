'use client';

import React, { useState } from 'react';
import {
  Video,
  Copy,
  Check,
  ExternalLink,
  Maximize2,
  Minimize2,
  Award,
  Users,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Session, HelpRequest } from '@/types/api.types';

export interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: Session | null;
  helpRequest?: HelpRequest | null;
  onCompleteAndReview?: (session: Session) => void;
}

export function SessionModal({
  isOpen,
  onClose,
  session,
  helpRequest,
  onCompleteAndReview,
}: SessionModalProps) {
  const [copied, setCopied] = useState(false);
  const [showEmbeddedVideo, setShowEmbeddedVideo] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!session) return null;

  // Generar o usar el enlace de Jitsi Meet devuelto por el backend
  const jitsiUrl =
    (session as { meetLink?: string }).meetLink ||
    `https://meet.jit.si/codepair-${session.roomCode.toLowerCase()}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(jitsiUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={showEmbeddedVideo && isFullScreen ? '2xl' : 'xl'}
      title={
        <div className="flex items-center gap-2 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30">
            <Video className="h-5 w-5" />
          </div>
          <span>Sesión de Pair Programming</span>
        </div>
      }
      description="Tu sala de videollamada y colaboración en tiempo real con Jitsi Meet está lista"
    >
      <div className="space-y-5">
        {/* Banner de Estado Activo */}
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span>Sala Generada Exitosamente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Código de sala:</span>
              <span className="rounded bg-surface-300 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-slate-700">
                {session.roomCode}
              </span>
            </div>
          </div>
        </div>

        {/* Resumen de la Solicitud y Participantes */}
        <div className="rounded-xl border border-slate-800 bg-surface-100/60 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider text-slate-300">
              <Users className="h-3.5 w-3.5 text-brand-400" />
              Participantes Conectados
            </span>
            <Badge variant="cyan" size="sm">
              {session.language}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Host / Estudiante */}
            <div className="flex items-center gap-2.5 rounded-lg bg-surface-200/60 p-2.5 border border-slate-800">
              <div className="h-8 w-8 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-xs font-bold text-brand-300">
                {session.host?.displayName?.slice(0, 2).toUpperCase() || 'ES'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {session.host?.displayName || 'Estudiante'}
                </p>
                <p className="text-[10px] text-slate-500">Autor de la solicitud</p>
              </div>
            </div>

            {/* Participante / Mentor */}
            <div className="flex items-center gap-2.5 rounded-lg bg-surface-200/60 p-2.5 border border-slate-800">
              <div className="h-8 w-8 rounded-full bg-accent-purple/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300">
                {session.participant?.displayName?.slice(0, 2).toUpperCase() || 'ME'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {session.participant?.displayName || 'Mentor emparejado'}
                </p>
                <p className="text-[10px] text-slate-500">Mentor en sesión</p>
              </div>
            </div>
          </div>

          {/* Título de la Solicitud */}
          {helpRequest && (
            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-xs font-medium text-slate-300 line-clamp-1">
                <span className="text-slate-500">Tema: </span>
                {helpRequest.title}
              </p>
            </div>
          )}
        </div>

        {/* Caja de Enlace a Jitsi Meet con Botón de Copiar */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Enlace Directo de Videollamada (Jitsi Meet)
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={jitsiUrl}
                className="w-full rounded-lg bg-surface-100 border border-slate-800 px-3.5 py-2.5 text-xs font-mono text-cyan-300 outline-none select-all"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              leftIcon={
                copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )
              }
              className="h-9 px-3 text-xs shrink-0"
            >
              {copied ? '¡Copiado!' : 'Copiar'}
            </Button>
          </div>
          <p className="text-[11px] text-slate-500">
            Comparte este enlace o ábrelo directamente en tu navegador para iniciar la llamada con
            audio, vídeo y pantalla compartida.
          </p>
        </div>

        {/* Vista Embebida de Jitsi Meet (Iframe) */}
        {showEmbeddedVideo && (
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-black shadow-2xl space-y-2 animate-slide-up">
            <div className="flex items-center justify-between bg-surface-100 px-3 py-2 border-b border-slate-800 text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-brand-400" />
                Jitsi Meet Embebido
              </span>
              <button
                type="button"
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                title={isFullScreen ? 'Reducir tamaño' : 'Pantalla completa'}
              >
                {isFullScreen ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            <div className={isFullScreen ? 'h-[500px]' : 'h-[360px]'}>
              <iframe
                src={`${jitsiUrl}#config.startWithAudioMuted=false&config.startWithVideoMuted=false`}
                allow="camera; microphone; fullscreen; display-capture"
                className="w-full h-full border-0"
                title="Sesión de Jitsi Meet"
              />
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowEmbeddedVideo(!showEmbeddedVideo)}
            leftIcon={<Video className="h-3.5 w-3.5 text-cyan-400" />}
            className="w-full sm:w-auto text-xs"
          >
            {showEmbeddedVideo ? 'Ocultar video embebido' : 'Ver video aquí'}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Abrir en nueva pestaña */}
            <a
              href={jitsiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 text-xs font-semibold shadow-lg shadow-brand-500/20 transition-all cursor-pointer flex-1 sm:flex-initial"
            >
              <span>Abrir Jitsi Meet</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {/* Finalizar sesión y calificar */}
            {onCompleteAndReview && (
              <Button
                type="button"
                variant="glow"
                size="sm"
                onClick={() => {
                  onClose();
                  onCompleteAndReview(session);
                }}
                leftIcon={<Award className="h-3.5 w-3.5" />}
                className="text-xs font-semibold flex-1 sm:flex-initial"
              >
                Concluir & Calificar
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
