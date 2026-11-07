'use client';

import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

export function LogoutButton() {
  const router = useRouter();

  async function sair() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" onClick={sair} className="text-slate-600 hover:text-brand">
      Sair
    </button>
  );
}
