'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, LogIn, UserPlus } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

interface UserData {
  id: string;
  displayName: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

export function NavbarAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = () => {
    try {
      const stored = localStorage.getItem('codepair_user');
      if (stored) {
        setUser(JSON.parse(stored));
        setLoading(false);
      }
    } catch {
      // ignore
    }

    apiClient.get('/auth/me')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data?.id) {
          setUser(data);
          localStorage.setItem('codepair_user', JSON.stringify(data));
        } else {
          setUser(null);
          localStorage.removeItem('codepair_user');
        }
      })
      .catch(() => {
        // Not authenticated
        setUser(null);
        localStorage.removeItem('codepair_user');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUser();

    const handleStorageChange = () => fetchUser();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('codepair_user');
    localStorage.removeItem('codepair_access_token');
    setUser(null);
    toast.success('Sesión cerrada correctamente');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 bg-slate-800/60 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (user) {
    const initials = (user.displayName || user.username || 'CP').slice(0, 2).toUpperCase();

    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-surface-100/90 border border-slate-800 px-2.5 py-1.5 shadow-sm">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-accent-purple text-[11px] font-bold text-white shadow">
            {initials}
          </div>
          <div className="hidden sm:block text-left pr-1">
            <p className="text-xs font-semibold text-slate-100 leading-tight">
              {user.displayName || user.username}
            </p>
            <span className="text-[10px] font-mono text-brand-400 uppercase tracking-wider">
              {user.role}
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-surface-100 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-surface-200 hover:text-white transition-all"
      >
        <LogIn className="h-3.5 w-3.5" />
        <span>Iniciar sesión</span>
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-500/20 hover:bg-brand-500 transition-all"
      >
        <UserPlus className="h-3.5 w-3.5" />
        <span>Registrarse</span>
      </Link>
    </div>
  );
}
