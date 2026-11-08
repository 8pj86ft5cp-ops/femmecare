'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ABAS = [
  { href: '/jornada', label: 'Caderno' },
  { href: '/jornada/resultados', label: 'Resultados' },
  { href: '/jornada/ultrassom', label: 'Ultrassom' },
  { href: '/jornada/receitas', label: 'Receitas' },
  { href: '/jornada/solicitacoes', label: 'Solicitações' },
  { href: '/jornada/agenda', label: 'Agenda' },
  { href: '/jornada/glicemia', label: 'Glicemia' },
  { href: '/jornada/pressao', label: 'Pressão' },
  { href: '/jornada/enviar-docs', label: 'Enviar docs' },
];

export function TabNav() {
  const atual = usePathname();
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls="navegacao-jornada"
        onClick={() => setAberto(!aberto)}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-[#efe3de] bg-[#fffdfb] px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-brand hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
      >
        <span aria-hidden="true">{aberto ? '×' : '☰'}</span>
        {aberto ? 'Fechar menu' : 'Navegação'}
      </button>

      {aberto && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setAberto(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
        />
      )}

      <nav
        id="navegacao-jornada"
        aria-label="Seções da sua área"
        className={`group fixed bottom-0 left-0 top-16 z-40 w-64 overflow-hidden border-r border-[#efe3de] bg-[#fffdfb] px-2 py-5 shadow-lg transition-[width,transform] duration-200 lg:z-30 lg:w-16 lg:shadow-sm lg:hover:w-64 lg:focus-within:w-64 ${
          aberto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <p className="mb-4 whitespace-nowrap px-3 text-xs font-semibold uppercase tracking-wider text-[#9b7779] lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
          Sua jornada
        </p>
        <ul className="space-y-1.5">
          {ABAS.map((aba) => {
            const ativa = aba.href === '/jornada' ? atual === '/jornada' : atual.startsWith(aba.href);
            return (
              <li key={aba.href}>
                <Link
                  href={aba.href}
                  aria-current={ativa ? 'page' : undefined}
                  onClick={() => setAberto(false)}
                  className={`flex items-center gap-3 whitespace-nowrap rounded-xl px-1.5 py-2.5 text-sm transition ${
                    ativa
                      ? 'bg-[#dcebdc] font-semibold text-[#456b49]'
                      : 'bg-[var(--sage-soft)] text-[#58765b] hover:bg-[#e1eee1] hover:text-[#456b49]'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                      ativa ? 'bg-white/80 text-[#456b49]' : 'bg-white/80 text-[var(--sage)]'
                    }`}
                  >
                    {aba.label.slice(0, 2)}
                  </span>
                  <span className="transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                    {aba.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
