'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';

const CAMPO =
  'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

interface ConviteValidado {
  name: string;
  email: string;
}

export function PrimeiroAcessoForm() {
  const [token, setToken] = useState<string | null>(null);
  const [paciente, setPaciente] = useState<ConviteValidado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const processouUrl = useRef(false);

  useEffect(() => {
    if (processouUrl.current) return;
    processouUrl.current = true;
    const url = new URL(window.location.href);
    const tokenConvite = url.searchParams.get('token') ?? url.hash.slice(1);
    url.searchParams.delete('token');
    url.hash = '';
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);

    if (!tokenConvite) {
      setErro('O link de convite está incompleto.');
      setCarregando(false);
      return;
    }

    setToken(tokenConvite);
  }, []);

  useEffect(() => {
    if (!token) return;
    let ativo = true;
    apiFetch<ConviteValidado>('/auth/first-access/validate', {
      method: 'POST',
      body: { token },
    })
      .then((dados) => {
        if (ativo) setPaciente(dados);
      })
      .catch((err: unknown) => {
        if (!ativo) return;
        setErro(
          err instanceof ApiError
            ? err.message
            : 'Não foi possível validar o convite. Tente novamente.',
        );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [token]);

  async function definirSenha(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = new FormData(e.currentTarget);
    const senha = String(form.get('password') ?? '');
    const confirmacao = String(form.get('confirmPassword') ?? '');
    if (senha !== confirmacao) {
      setErro('As senhas não coincidem.');
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      await apiFetch<void>('/auth/first-access', {
        method: 'POST',
        body: { token, password: senha, consentAccepted: true, consentVersion: '1.0-provisorio' },
      });
      setConcluido(true);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível definir a senha.');
    } finally {
      setEnviando(false);
    }
  }

  if (carregando) {
    return <p role="status" className="rounded-2xl bg-[#fffdfb] p-6 text-sm text-slate-600 shadow-sm">Validando convite…</p>;
  }

  if (concluido) {
    return (
      <section className="space-y-4 rounded-2xl border border-[#dcebdc] bg-[#fffdfb] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Senha criada com sucesso</h2>
        <p className="text-sm text-slate-600">
          Agora você pode entrar na sua área com o e-mail do convite e a senha que acabou de criar.
        </p>
        <Link href="/login" className="inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white">
          Ir para o login
        </Link>
      </section>
    );
  }

  if (!paciente) {
    return (
      <section className="space-y-3 rounded-2xl bg-[#fffdfb] p-6 shadow-sm">
        <p role="alert" className="text-sm text-red-700">{erro ?? 'Este convite não é válido.'}</p>
        <p className="text-sm text-slate-600">Peça à sua médica um novo link de primeiro acesso.</p>
        <Link href="/login" className="text-sm font-medium text-brand hover:underline">Ir para o login</Link>
      </section>
    );
  }

  return (
    <form onSubmit={definirSenha} className="space-y-4 rounded-2xl bg-[#fffdfb] p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Olá, {paciente.name}</h2>
        <p className="mt-1 text-sm text-slate-600">Crie uma senha para acessar sua área.</p>
        <p className="mt-2 text-sm text-slate-500">{paciente.email}</p>
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Nova senha</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={CAMPO}
        />
        <p className="mt-1 text-xs text-slate-500">Use pelo menos 8 caracteres.</p>
      </div>
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium">Confirme a senha</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          className={CAMPO}
        />
      </div>
      <label className="flex items-start gap-3 rounded-xl bg-[#edf5ed] p-3 text-sm text-slate-700">
        <input type="checkbox" name="consent" required className="mt-1 h-4 w-4 accent-[#58765b]" />
        <span>
          Li e aceito o termo provisório de uso e o tratamento dos meus dados de saúde para o acompanhamento
          pela equipe responsável. O texto será substituído após revisão jurídica.
        </span>
      </label>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <button type="submit" disabled={enviando} className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60">
        {enviando ? 'Salvando…' : 'Criar senha'}
      </button>
    </form>
  );
}
