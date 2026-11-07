'use client';

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

  return (
    <nav aria-label="Seções da sua área" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-2 pb-1">
        {ABAS.map((aba) => {
          const ativa = aba.href === '/jornada' ? atual === '/jornada' : atual.startsWith(aba.href);
          return (
            <li key={aba.href}>
              <Link
                href={aba.href}
                aria-current={ativa ? 'page' : undefined}
                className={`block rounded-full px-4 py-2 text-sm transition ${
                  ativa ? 'bg-brand-soft font-semibold text-brand' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {aba.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
