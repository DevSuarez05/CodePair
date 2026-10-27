'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <RegisterForm
        initialAuthMode="register"
        onSuccess={() => {
          toast.success('¡Registro exitoso! Redirigiendo al feed...');
          router.push('/');
        }}
        onNavigateToLogin={() => router.push('/login')}
      />
      <p className="text-center text-xs text-slate-500">
        <Link href="/" className="text-brand-400 hover:text-brand-300 font-medium">
          ← Volver al inicio
        </Link>
      </p>
    </div>
  );
}
