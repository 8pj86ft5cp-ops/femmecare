import type { ReactNode } from 'react';

/** Bloco da tela. As seções sempre ficam uma abaixo da outra. */
export function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl border border-[#f0e5e0] bg-[#fffdfb] p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">{titulo}</h2>
        {descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}
