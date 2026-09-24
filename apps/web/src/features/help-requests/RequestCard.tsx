'use client';

import React from 'react';
import {
  Clock,
  Code2,
  Terminal,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge, PriorityBadge, StatusBadge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import type { HelpRequest } from '@/types/api.types';

export interface RequestCardProps {
  request: HelpRequest;
  onAccept?: (request: HelpRequest) => void;
  isAccepting?: boolean;
}

export function RequestCard({ request, onAccept, isAccepting = false }: RequestCardProps) {
  const author = request.student;
  const authorName = author?.displayName || author?.username || 'Desarrollador';
  const authorUsername = author?.username ? `@${author.username}` : '';
  const authorInitials = authorName.slice(0, 2).toUpperCase();

  const isAvailableForHelp = request.status === 'OPEN';

  return (
    <article className="group relative rounded-xl border border-slate-800/80 bg-surface-100/90 p-5 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-brand-500/50 hover:bg-surface-100 hover:shadow-brand-500/10 hover:shadow-2xl">
      {/* Glow de acento en hover */}
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-brand-500/20 via-accent-purple/20 to-accent-cyan/20 opacity-0 blur transition duration-300 group-hover:opacity-100 -z-10" />

      {/* Header: Autor, Fecha Relativa y Badges de Estado/Prioridad */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar de autor */}
          {author?.avatarUrl ? (
            <img
              src={author.avatarUrl}
              alt={authorName}
              className="h-10 w-10 rounded-full border border-slate-700 object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-accent-purple text-xs font-bold text-white shadow-md">
              {authorInitials}
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-100">{authorName}</span>
              {authorUsername && (
                <span className="text-xs font-mono text-slate-500">{authorUsername}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(request.createdAt)}</span>
              {request.estimatedMinutes && (
                <>
                  <span>•</span>
                  <span>~{request.estimatedMinutes} min</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Badges de Estado y Prioridad */}
        <div className="flex items-center gap-2">
          <PriorityBadge priority={request.priority} />
          <StatusBadge status={request.status} />
        </div>
      </div>

      {/* Título de la solicitud */}
      <h3 className="text-lg font-bold text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-2 mb-2">
        {request.title}
      </h3>

      {/* Descripción resumida */}
      <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed mb-4">
        {request.description}
      </p>

      {/* Snippet de código si existe */}
      {request.codeSnippet && (
        <div className="mb-4 rounded-lg bg-surface-300/80 border border-slate-800/90 p-3">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Terminal className="h-3 w-3 text-cyan-400" />
              Snippet relevante ({request.language})
            </span>
          </div>
          <pre className="font-mono text-xs text-cyan-300/90 overflow-x-auto max-h-24">
            <code>{request.codeSnippet.trim()}</code>
          </pre>
        </div>
      )}

      {/* Footer: Tags de Tecnología, Disponibilidad y Botón de Acción */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
        {/* Tecnologías & Lenguaje */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="cyan" size="sm">
            <Code2 className="h-3 w-3" />
            <span>{request.language}</span>
          </Badge>

          {request.skills &&
            request.skills.map((skill) => (
              <Badge key={skill.id} variant="brand" size="sm">
                <span>{skill.name}</span>
              </Badge>
            ))}
        </div>

        {/* Botón de Ayudar / Emparejar */}
        {isAvailableForHelp && onAccept ? (
          <Button
            variant="glow"
            size="sm"
            isLoading={isAccepting}
            onClick={() => onAccept(request)}
            rightIcon={<Sparkles className="h-3.5 w-3.5" />}
            className="font-semibold px-4 text-xs"
          >
            Ayudar / Emparejar
          </Button>
        ) : (
          <span className="text-xs text-slate-500 italic">
            {request.status === 'IN_PROGRESS'
              ? 'Sesión en curso'
              : 'Solicitud concluida'}
          </span>
        )}
      </div>
    </article>
  );
}
