'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { HOME_POR_PAPEL } from '@/lib/papeis';
import type { Me } from '@/lib/types';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function LoginForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const dados = new FormData(e.currentTarget);

    try {
      const me = await apiFetch<Me>('/auth/login', {
        method: 'POST',
        body: { email: dados.get('email'), password: dados.get('password') },
      });
      router.push(HOME_POR_PAPEL[me.role]);
      router.refresh();
    } catch (err) {
      setErro(
        err instanceof ApiError && err.status === 401
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar. Tente novamente.',
      );
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="mx-auto max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className={CAMPO} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Senha</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={CAMPO} />
      </div>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60"
      >
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
