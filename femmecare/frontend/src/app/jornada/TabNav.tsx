'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { PatientNotifications } from '@/lib/types';

const ABAS = [
  { href: '/jornada', label: 'Caderno', icon: '⌂' },
  { href: '/jornada/agenda', label: 'Agenda', icon: '□', notification: 'appointment' as const },
  { href: '/jornada/resultados', label: 'Resultados', icon: '▤', notification: 'documents' as const },
  { href: '/jornada/pressao', label: 'Pressão', icon: '♡' },
  { href: '/jornada/glicemia', label: 'Glicemia', icon: '◉' },
  { href: '/jornada/ultrassom', label: 'Ultrassom', icon: '⌕', notification: 'documents' as const },
  { href: '/jornada/receitas', label: 'Receitas', icon: '＋' },
  { href: '/jornada/solicitacoes', label: 'Solicitações', icon: '☷' },
  { href: '/jornada/enviar-docs', label: 'Enviar docs', icon: '↑' },
  { href: '/jornada/plano-de-parto', label: 'Plano de parto', icon: '✓' },
  { href: '/jornada/meus-dados', label: 'Meus dados', icon: '◌' },
];

const PRINCIPAIS = ABAS.slice(0, 5);
const MAIS = ABAS.slice(5);
const VAZIO: PatientNotifications = { documents: 0, appointment: 0 };

function ativo(atual: string, href: string) {
  return href === '/jornada' ? atual === href : atual.startsWith(href);
}

export function TabNav() {
  const atual = usePathname();
  const [aberto, setAberto] = useState(false);
  const [novidades, setNovidades] = useState(VAZIO);
  const [erroNovidades, setErroNovidades] = useState<string | null>(null);

  const buscarNovidades = useCallback(async () => {
    try {
      setNovidades(await apiFetch<PatientNotifications>('/patients/me/notifications'));
      setErroNovidades(null);
    } catch (erro) {
      setErroNovidades(
        erro instanceof ApiError
          ? 'Não foi possível atualizar as novidades.'
          : 'Falha ao carregar as novidades.',
      );
    }
  }, []);

  useEffect(() => {
    void buscarNovidades();
    const timer = window.setInterval(() => void buscarNovidades(), 30_000);
    return () => window.clearInterval(timer);
  }, [buscarNovidades]);

  useEffect(() => {
    setAberto(false);
  }, [atual]);

  async function marcarLida(secao?: 'documents' | 'appointment') {
    if (!secao) return;
    try {
      await apiFetch<void>('/patients/me/notifications/read', {
        method: 'POST',
        body: { section: secao },
      });
      setNovidades((estado) => ({ ...estado, [secao]: 0 }));
      setErroNovidades(null);
    } catch {
      setErroNovidades('Não foi possível marcar a novidade como lida.');
    }
  }

  function badge(secao?: 'documents' | 'appointment') {
    if (!secao || novidades[secao] === 0) return null;
    return (
      <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" aria-label="Novidade não lida" />
    );
  }

  function links(abas: typeof ABAS, compacto = false) {
    return abas.map((aba) => {
      const selecionada = ativo(atual, aba.href);
      return (
        <li key={aba.href}>
          <Link
            href={aba.href}
            aria-current={selecionada ? 'page' : undefined}
            onClick={() => {
              setAberto(false);
              void marcarLida(aba.notification);
            }}
            className={`relative flex ${compacto ? 'min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2' : 'items-center gap-3 px-2.5 py-2.5'} whitespace-nowrap rounded-xl text-sm transition ${
              selecionada
                ? 'bg-[#dcebdc] font-semibold text-[#456b49]'
                : 'bg-[var(--sage-soft)] text-[#58765b] hover:bg-[#e1eee1] hover:text-[#456b49]'
            }`}
          >
            <span className={`relative flex ${compacto ? 'h-7 w-8' : 'h-9 w-9'} shrink-0 items-center justify-center rounded-lg bg-white/80 text-base`} aria-hidden="true">
              {aba.icon}
              {compacto && badge(aba.notification)}
            </span>
            <span className={compacto ? 'max-w-full truncate text-[10px] leading-tight' : ''}>{aba.label}</span>
            {!compacto && badge(aba.notification)}
          </Link>
        </li>
      );
    });
  }

  return (
    <>
      <nav aria-label="Seções da sua área" className="group fixed bottom-0 left-0 top-16 z-30 hidden w-16 overflow-hidden border-r border-[#efe3de] bg-[#fffdfb] px-2 py-5 shadow-sm transition-[width] duration-200 hover:w-64 focus-within:w-64 lg:block">
        <p className="mb-4 whitespace-nowrap px-3 text-xs font-semibold uppercase tracking-wider text-[#9b7779] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
          Sua jornada
        </p>
        <ul className="space-y-1.5">{links(ABAS)}</ul>
      </nav>

      {aberto && (
        <button
          type="button"
          aria-label="Fechar menu Mais"
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-40 bg-slate-900/20 lg:hidden"
        />
      )}
      {aberto && (
        <nav id="mais-secoes" aria-label="Mais seções" className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl border border-[#dcebdc] bg-[#fffdfb] p-4 shadow-xl lg:hidden">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Mais opções</h2>
          <ul className="grid grid-cols-2 gap-2">{links(MAIS)}</ul>
        </nav>
      )}

      <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dcebdc] bg-[#fffdfb] px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(54,85,56,0.08)] lg:hidden">
        <ul className="mx-auto flex max-w-xl items-stretch gap-1">
          {links(PRINCIPAIS, true)}
          <li className="min-w-0 flex-1">
            <button
              type="button"
              aria-expanded={aberto}
              aria-controls="mais-secoes"
              onClick={() => setAberto(!aberto)}
              className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2 text-sm ${
                aberto || MAIS.some((aba) => ativo(atual, aba.href))
                  ? 'bg-[#dcebdc] font-semibold text-[#456b49]'
                  : 'text-[#58765b]'
              }`}
            >
              <span className="flex h-7 w-8 items-center justify-center text-base" aria-hidden="true">{aberto ? '×' : '•••'}</span>
              <span className="text-[10px] leading-tight">{aberto ? 'Fechar' : 'Mais'}</span>
            </button>
          </li>
        </ul>
      </nav>
      {erroNovidades && (
        <p role="status" className="fixed bottom-16 left-2 z-50 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-amber-900 shadow-sm lg:bottom-auto lg:left-20 lg:top-20">
          {erroNovidades}
        </p>
      )}
    </>
  );
}
