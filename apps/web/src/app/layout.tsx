import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'CodePair - Plataforma de Pair Programming Colaborativo',
  description:
    'Conecta con otros desarrolladores para resolver bloqueos técnicos en tiempo real mediante Pair Programming, videollamadas con Jitsi Meet y retroalimentación entre pares.',
  keywords: [
    'Pair Programming',
    'Code Mentorship',
    'TypeScript',
    'React',
    'Next.js',
    'Developer Collaboration',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-surface-300 text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-surface-200/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan shadow-lg shadow-brand-500/20">
                <span className="font-mono font-black text-white text-base">CP</span>
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight">CodePair</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  v1.0 Developer Preview
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="hidden md:inline-flex items-center gap-1.5 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Comunidad activa
              </span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>

        <footer className="border-t border-slate-800/80 bg-surface-200/50 py-6 text-center text-xs text-slate-500">
          <p>© 2026 CodePair — Plataforma Colaborativa de Pair Programming para Desarrolladores.</p>
        </footer>

        <Toaster position="bottom-right" richColors theme="dark" />
      </body>
    </html>
  );
}
