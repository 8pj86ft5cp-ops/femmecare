'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function GestacaoForm({ pacienteId, dumAtual }: { pacienteId: string; dumAtual: string | null }) {
  const router = useRouter();
  const [dum, setDum] = useState(dumAtual ?? '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    setOk(null);
    try {
      const r = await apiFetch<{ dpp: string; weeks: number; days: number }>(
        `/doctors/patients/${encodeURIComponent(pacienteId)}/gestation`,
        { method: 'PUT', body: { dum } },
      );
      setOk(`Salvo. Idade gestacional: ${r.weeks} semanas e ${r.days} dias. DPP estimada registrada.`);
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a DUM.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-3">
      <div>
        <label htmlFor="dum" className="mb-1 block text-sm font-medium">Data da última menstruação (DUM)</label>
        <input id="dum" type="date" required value={dum} onChange={(e) => setDum(e.target.value)} className={CAMPO} />
      </div>
      <button type="submit" disabled={enviando} className="rounded-lg bg-brand px-5 py-2 font-medium text-white disabled:opacity-60">
        {enviando ? 'Salvando…' : 'Salvar DUM'}
      </button>
      {ok && <p role="status" className="text-sm text-green-700">{ok}</p>}
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    </form>
  );
}
