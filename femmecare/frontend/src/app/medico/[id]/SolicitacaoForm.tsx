'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function SolicitacaoForm({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function solicitar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const dados = new FormData(formulario);
    setEnviando(true);
    setErro(null);
    try {
      await apiFetch(`/doctors/patients/${encodeURIComponent(pacienteId)}/exam-requests`, {
        method: 'POST',
        body: { name: dados.get('name'), notes: dados.get('notes') },
      });
      formulario.reset();
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível criar a solicitação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={solicitar} className="space-y-3">
      <div>
        <label htmlFor="exame" className="mb-1 block text-sm font-medium">Exame</label>
        <input id="exame" name="name" required maxLength={200} placeholder="Ex.: Hemograma completo" className={CAMPO} />
      </div>
      <div>
        <label htmlFor="obs" className="mb-1 block text-sm font-medium">Orientação (opcional)</label>
        <input id="obs" name="notes" maxLength={500} placeholder="Ex.: Jejum de 8 horas" className={CAMPO} />
      </div>
      <button type="submit" disabled={enviando} className="rounded-lg bg-brand px-5 py-2 font-medium text-white disabled:opacity-60">
        {enviando ? 'Salvando…' : 'Adicionar solicitação'}
      </button>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    </form>
  );
}
