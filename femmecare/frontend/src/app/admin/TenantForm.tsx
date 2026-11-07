'use client';

import { useRouter } from 'next/navigation';
import { useState, type CSSProperties, type FormEvent } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { Tenant } from '@/lib/types';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function TenantForm({ inicial }: { inicial: Tenant }) {
  const router = useRouter();
  const [nome, setNome] = useState(inicial.name);
  const [logo, setLogo] = useState(inicial.logoUrl ?? '');
  const [cor, setCor] = useState(inicial.primaryColor ?? '#0f766e');
  const [enviando, setEnviando] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setStatus(null);
    try {
      await apiFetch<Tenant>('/admin/tenant', {
        method: 'PUT',
        body: { name: nome, logoUrl: logo || null, primaryColor: cor },
      });
      setStatus('Alterações salvas.');
      router.refresh(); // o layout reaplica o tema com a nova cor
    } catch {
      setStatus('Não foi possível salvar. Verifique os dados.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Identidade visual</h2>
      <p className="text-sm text-slate-500">As alterações valem para o site inteiro da clínica.</p>

      <div>
        <label htmlFor="nome" className="mb-1 block text-sm font-medium">Nome da clínica</label>
        <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={150} className={CAMPO} />
      </div>

      <div>
        <label htmlFor="logo" className="mb-1 block text-sm font-medium">URL do logo</label>
        <input id="logo" type="url" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." className={CAMPO} />
      </div>

      <div>
        <label htmlFor="cor" className="mb-1 block text-sm font-medium">Cor principal</label>
        <input id="cor" type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-10 w-20 cursor-pointer rounded border border-slate-300" />
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-slate-200 p-4" style={{ '--brand': cor } as CSSProperties}>
        <span className="text-sm text-slate-500">Prévia:</span>
        <span className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">Botão de exemplo</span>
      </div>

      {status && <p role="status" className="text-sm text-slate-700">{status}</p>}

      <button type="submit" disabled={enviando} className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white disabled:opacity-60">
        {enviando ? 'Salvando…' : 'Salvar alterações'}
      </button>
    </form>
  );
}
