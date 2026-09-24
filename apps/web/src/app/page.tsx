'use client';

import React, { useState } from 'react';
import {
  UserPlus,
  FileQuestion,
  Layers,
  Video,
  Sparkles,
} from 'lucide-react';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { CreateRequestForm } from '@/features/help-requests/CreateRequestForm';
import { RequestFeed } from '@/features/help-requests/RequestFeed';
import { SessionModal } from '@/features/sessions/SessionModal';
import { FeedbackModal } from '@/features/feedbacks/FeedbackModal';
import { Button } from '@/components/ui/Button';
import type { Session, HelpRequest } from '@/types/api.types';
import { toast } from 'sonner';

type ActiveTab = 'feed' | 'register' | 'new-request';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');

  // Estados para modales interactivos HU-04 y HU-05
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [activeHelpRequest, setActiveHelpRequest] = useState<HelpRequest | null>(null);

  const [feedbackSession, setFeedbackSession] = useState<Session | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Manejo del evento "Ayudar / Emparejar" en una tarjeta del feed (HU-03 -> HU-04)
  const handleAcceptRequest = (request: HelpRequest) => {
    setActiveHelpRequest(request);

    // Mock/crear sesión de pairing asociada con sala Jitsi
    const roomCode = `CP-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const newSession: Session = {
      id: `sess-${Date.now()}`,
      requestId: request.id,
      hostId: request.studentId,
      participantId: 'current-mentor-uuid',
      title: request.title,
      description: request.description,
      roomCode: roomCode,
      language: request.language,
      status: 'ACTIVE',
      isPrivate: false,
      scheduledAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationSeconds: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      host: request.student,
      participant: {
        id: 'current-mentor-uuid',
        displayName: 'Mentor Conectado (Tú)',
        username: 'mentor_lead',
        email: 'mentor@codepair.dev',
        avatarUrl: null,
        bio: 'Senior Fullstack Engineer',
        githubUrl: null,
        linkedinUrl: null,
        role: 'MENTOR',
        status: 'ACTIVE',
        isEmailVerified: true,
        preferredLanguage: request.language,
        timezone: 'UTC',
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    };

    setSelectedSession(newSession);
    setIsSessionModalOpen(true);
    toast.success('¡Te has emparejado exitosamente a la sesión!');
  };

  // Manejo del paso HU-04 -> HU-05: Concluir sesión y abrir modal de calificación
  const handleCompleteAndReview = (session: Session) => {
    setIsSessionModalOpen(false);
    setFeedbackSession(session);
    setIsFeedbackModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-surface-100/90 via-surface-200/90 to-surface-300 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-950/60 px-3.5 py-1 text-xs font-semibold text-brand-300 shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-accent-cyan" />
            <span>CodePair UI/UX Suite • Sistema de Componentes</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Pair Programming <br />
            <span className="bg-gradient-to-r from-brand-400 via-accent-cyan to-accent-purple bg-clip-text text-transparent">
              en Vivo y Colaborativo
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300/90 max-w-2xl leading-relaxed">
            Plataforma diseñada por y para desarrolladores. Integra registro con niveles de
            skills interactivos (HU-01), publicación con preview markdown (HU-02), feed con filtros
            reactivos (HU-03), videollamadas con Jitsi Meet (HU-04) y evaluación 5 estrellas (HU-05).
          </p>

          {/* Navegación por Pestañas Principales */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'feed'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 border border-brand-500/40'
                  : 'bg-surface-100 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Feed & Filtros (HU-03)</span>
            </button>

            <button
              onClick={() => setActiveTab('register')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'register'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 border border-brand-500/40'
                  : 'bg-surface-100 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Registro & Skills (HU-01)</span>
            </button>

            <button
              onClick={() => setActiveTab('new-request')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'new-request'
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 border border-brand-500/40'
                  : 'bg-surface-100 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileQuestion className="h-4 w-4" />
              <span>Pedir Ayuda (HU-02)</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Abrir directamente modal de demostración Jitsi HU-04
                setSelectedSession({
                  id: 'demo-session',
                  requestId: 'req-001',
                  hostId: 'host-1',
                  participantId: 'part-1',
                  title: 'Resolución de Deadlocks en Prisma Client con MySQL',
                  description: 'Sesión activa de demostración',
                  roomCode: 'DEMO-77',
                  language: 'TYPESCRIPT',
                  status: 'ACTIVE',
                  isPrivate: false,
                  scheduledAt: new Date().toISOString(),
                  startedAt: new Date().toISOString(),
                  endedAt: null,
                  durationSeconds: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  host: {
                    id: 'host-1',
                    displayName: 'Alejandro Morales',
                    username: 'alex_morales',
                    email: 'alex@codepair.dev',
                    avatarUrl: null,
                    bio: null,
                    githubUrl: null,
                    linkedinUrl: null,
                    role: 'STUDENT',
                    status: 'ACTIVE',
                    isEmailVerified: true,
                    preferredLanguage: 'TYPESCRIPT',
                    timezone: 'America/Mexico_City',
                    lastLoginAt: null,
                    createdAt: new Date().toISOString(),
                  },
                  participant: {
                    id: 'part-1',
                    displayName: 'Carlos Vega (Mentor)',
                    username: 'carlos_mentor',
                    email: 'carlos@codepair.dev',
                    avatarUrl: null,
                    bio: null,
                    githubUrl: null,
                    role: 'MENTOR',
                    status: 'ACTIVE',
                    isEmailVerified: true,
                    linkedinUrl: null,
                    preferredLanguage: 'TYPESCRIPT',
                    timezone: 'UTC',
                    lastLoginAt: null,
                    createdAt: new Date().toISOString(),
                  },
                });
                setIsSessionModalOpen(true);
              }}
              leftIcon={<Video className="h-3.5 w-3.5 text-cyan-400" />}
              className="text-xs ml-auto"
            >
              Probar Modal Jitsi (HU-04)
            </Button>
          </div>
        </div>
      </section>

      {/* Contenido Dinámico según la Pestaña Activa */}
      <div className="transition-all duration-300">
        {activeTab === 'feed' && (
          <RequestFeed
            onOpenCreateModal={() => setActiveTab('new-request')}
            onAcceptRequest={handleAcceptRequest}
          />
        )}

        {activeTab === 'register' && (
          <div className="space-y-4">
            <RegisterForm
              onSuccess={() => {
                toast.success('¡Registro completado! Cambiando al Feed...');
                setTimeout(() => setActiveTab('feed'), 1500);
              }}
              onNavigateToLogin={() => {
                toast.info('Navegación a Login activada');
              }}
            />
          </div>
        )}

        {activeTab === 'new-request' && (
          <div className="space-y-4">
            <CreateRequestForm
              onSuccess={() => {
                toast.success('¡Solicitud creada! Volviendo al feed...');
                setActiveTab('feed');
              }}
              onCancel={() => setActiveTab('feed')}
            />
          </div>
        )}
      </div>

      {/* HU-04: Modal de Sesión & Jitsi Meet */}
      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        session={selectedSession}
        helpRequest={activeHelpRequest}
        onCompleteAndReview={handleCompleteAndReview}
      />

      {/* HU-05: Modal de Calificación y Feedback */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        session={feedbackSession}
        onSuccess={() => {
          toast.success('¡Calificación enviada! Gracias por tu feedback.');
        }}
      />
    </div>
  );
}
