'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RequestCard } from './RequestCard';
import { FeedFilters, FeedFilterState } from './FeedFilters';
import { RequestCardSkeleton } from '@/components/ui/Skeleton';
import apiClient from '@/lib/api-client';
import type { HelpRequest } from '@/types/api.types';

export interface RequestFeedProps {
  onOpenCreateModal?: () => void;
  onAcceptRequest?: (request: HelpRequest) => void;
  acceptingRequestId?: string | null;
}

// Datos semilla de demostración para fallback si la API no está en línea
const DEMO_REQUESTS: HelpRequest[] = [
  {
    id: 'req-001',
    studentId: 'user-001',
    mentorId: null,
    title: 'Problema de concurrencia en transacciones de Prisma con MySQL',
    description:
      'Tengo un bloqueo al procesar transferencias concurrentes. Ocurren deadlocks intermitentes en Prisma Client cuando múltiples usuarios aceptan una solicitud al mismo tiempo. Necesito ayuda para configurar los niveles de aislamiento y bloqueo pesimista.',
    codeSnippet: `await prisma.$transaction(async (tx) => {\n  const row = await tx.request.findUnique({ where: { id } });\n  if (row.status !== 'OPEN') throw new Error('Ya tomada');\n  await tx.session.create({ data: { requestId: id } });\n});`,
    errorMessage: 'PrismaClientKnownRequestError: Deadlock found when trying to get lock; try restarting transaction',
    language: 'TYPESCRIPT',
    status: 'OPEN',
    priority: 'HIGH',
    estimatedMinutes: 30,
    acceptedAt: null,
    resolvedAt: null,
    expiresAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
    student: {
      id: 'user-001',
      displayName: 'Alejandro Morales',
      username: 'alex_morales',
      email: 'alex@codepair.dev',
      avatarUrl: null,
      bio: 'Junior Backend Developer',
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
    skills: [
      {
        id: '1a111111-1111-1111-1111-111111111103',
        name: 'TypeScript',
        slug: 'typescript',
        category: 'Language',
        description: null,
        iconUrl: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '1a111111-1111-1111-1111-111111111105',
        name: 'MySQL',
        slug: 'mysql',
        category: 'Database',
        description: null,
        iconUrl: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'req-002',
    studentId: 'user-002',
    mentorId: null,
    title: 'Error de renderizado e hidratación con Server Components en Next.js 15',
    description:
      'Al leer tokens JWT almacenados en cookies HttpOnly dentro del layout raíz, obtengo advertencias de hidratación en React 19. El contenido parpadea entre SSR y el cliente.',
    codeSnippet: `export default async function RootLayout({ children }) {\n  const cookieStore = await cookies();\n  const token = cookieStore.get('accessToken');\n  return <html><body data-auth={!!token}>{children}</body></html>;\n}`,
    errorMessage: 'Hydration failed because the server-rendered HTML didn\'t match the client.',
    language: 'TYPESCRIPT',
    status: 'OPEN',
    priority: 'CRITICAL',
    estimatedMinutes: 45,
    acceptedAt: null,
    resolvedAt: null,
    expiresAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date().toISOString(),
    student: {
      id: 'user-002',
      displayName: 'Valentina Restrepo',
      username: 'valen_dev',
      email: 'valen@codepair.dev',
      avatarUrl: null,
      bio: 'Frontend enthusiast',
      githubUrl: null,
      linkedinUrl: null,
      role: 'STUDENT',
      status: 'ACTIVE',
      isEmailVerified: true,
      preferredLanguage: 'TYPESCRIPT',
      timezone: 'America/Bogota',
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    },
    skills: [
      {
        id: '1a111111-1111-1111-1111-111111111101',
        name: 'React',
        slug: 'react',
        category: 'Frontend',
        description: null,
        iconUrl: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '1a111111-1111-1111-1111-111111111110',
        name: 'Next.js',
        slug: 'nextjs',
        category: 'Frontend',
        description: null,
        iconUrl: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'req-003',
    studentId: 'user-003',
    mentorId: null,
    title: 'Optimización de consultas complejas con agregaciones en PostgreSQL',
    description:
      'Necesito ayuda para diseñar un índice compuesto y analizar el plan de ejecución `EXPLAIN ANALYZE` en una tabla con más de 2 millones de filas.',
    codeSnippet: null,
    errorMessage: null,
    language: 'SQL',
    status: 'OPEN',
    priority: 'MEDIUM',
    estimatedMinutes: 25,
    acceptedAt: null,
    resolvedAt: null,
    expiresAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    updatedAt: new Date().toISOString(),
    student: {
      id: 'user-003',
      displayName: 'Diego Fernandez',
      username: 'diegof',
      email: 'diego@codepair.dev',
      avatarUrl: null,
      bio: 'Fullstack Dev',
      githubUrl: null,
      linkedinUrl: null,
      role: 'STUDENT',
      status: 'ACTIVE',
      isEmailVerified: true,
      preferredLanguage: 'SQL',
      timezone: 'America/Buenos_Aires',
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
    },
    skills: [
      {
        id: '1a111111-1111-1111-1111-111111111106',
        name: 'PostgreSQL',
        slug: 'postgresql',
        category: 'Database',
        description: null,
        iconUrl: null,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

export function RequestFeed({
  onOpenCreateModal,
  onAcceptRequest,
  acceptingRequestId,
}: RequestFeedProps) {
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FeedFilterState>({
    search: '',
    skillId: '',
    language: '',
    status: '',
  });

  // Carga de solicitudes desde la API con fallback
  const fetchRequests = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.skillId) params.append('skillId', filters.skillId);
      if (filters.language) params.append('language', filters.language);
      if (filters.status) params.append('status', filters.status);

      const res = await apiClient.get(`/requests?${params.toString()}`);
      if (res.data?.data && Array.isArray(res.data.data)) {
        setRequests(res.data.data);
      } else {
        setRequests(DEMO_REQUESTS);
      }
    } catch {
      // Si la API no está corriendo, usar datos de prueba para asegurar una experiencia interactiva fluida
      setRequests(DEMO_REQUESTS);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.skillId, filters.language, filters.status]);

  // Filtrado reactivo en el cliente para búsqueda de texto
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = req.title.toLowerCase().includes(query);
        const matchDesc = req.description.toLowerCase().includes(query);
        const matchSkills = req.skills?.some((s) => s.name.toLowerCase().includes(query));
        if (!matchTitle && !matchDesc && !matchSkills) return false;
      }
      if (filters.language && req.language !== filters.language) return false;
      if (filters.status && req.status !== filters.status) return false;
      if (filters.skillId && !req.skills?.some((s) => s.id === filters.skillId)) return false;
      return true;
    });
  }, [requests, filters]);

  return (
    <section className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header del Feed */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-950/40 px-3 py-1 text-xs font-medium text-brand-400 mb-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Feed Global de Colaboración</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Solicitudes de Pair Programming
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Explora problemas reales de desarrolladores y empareja tu experiencia técnica
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRequests(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="h-10 text-xs"
          >
            Actualizar
          </Button>

          {onOpenCreateModal && (
            <Button
              variant="glow"
              size="sm"
              onClick={onOpenCreateModal}
              leftIcon={<Plus className="h-4 w-4" />}
              className="h-10 text-xs font-semibold px-4"
            >
              Pedir Ayuda
            </Button>
          )}
        </div>
      </div>

      {/* Barra de Filtros Dinámicos */}
      <FeedFilters
        filters={filters}
        onChange={setFilters}
        totalCount={filteredRequests.length}
      />

      {/* Feedback de Error si ocurre */}
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/60 p-4 text-sm text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchRequests()}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Lista de Tarjetas o Skeletons de Carga */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <RequestCardSkeleton />
            <RequestCardSkeleton />
            <RequestCardSkeleton />
          </>
        ) : filteredRequests.length === 0 ? (
          /* Estado Vacío (Empty State) */
          <div className="rounded-2xl border border-dashed border-slate-800 bg-surface-100/40 p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-200 border border-slate-800 text-slate-500 shadow-inner">
              <Inbox className="h-7 w-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-200">
                No hay solicitudes que coincidan con tus filtros
              </h3>
              <p className="text-xs text-slate-400">
                Prueba relajando los filtros de tecnología o sé el primero en publicar un bloqueo
                para colaborar.
              </p>
            </div>
            {onOpenCreateModal && (
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenCreateModal}
                leftIcon={<Plus className="h-4 w-4" />}
                className="text-xs font-semibold"
              >
                Publicar primera solicitud
              </Button>
            )}
          </div>
        ) : (
          filteredRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onAccept={onAcceptRequest}
              isAccepting={acceptingRequestId === request.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
