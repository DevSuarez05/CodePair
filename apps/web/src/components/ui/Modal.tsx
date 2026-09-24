'use client';

import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}: ModalProps) {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/* Backdrop blur */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm transition-opacity duration-200 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />

        {/* Modal Container */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <DialogPrimitive.Content
            className={cn(
              'relative w-full rounded-2xl border border-slate-800 bg-surface-200/95 p-6 shadow-2xl backdrop-blur-xl',
              'transition-all duration-200 data-[state=open]:animate-slide-up',
              'text-slate-100 focus:outline-none',
              maxWidths[maxWidth],
            )}
          >
            {showCloseButton && (
              <DialogPrimitive.Close
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-surface-50 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            )}

            {title && (
              <DialogPrimitive.Title className="text-xl font-bold tracking-tight text-white mb-1 flex items-center gap-2">
                {title}
              </DialogPrimitive.Title>
            )}

            {description && (
              <DialogPrimitive.Description className="text-sm text-slate-400 mb-5">
                {description}
              </DialogPrimitive.Description>
            )}

            <div className="mt-4">{children}</div>
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
