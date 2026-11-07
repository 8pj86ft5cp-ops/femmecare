'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function AgendaForm({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function agendar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const dados = new FormData(formulario);
    const quando = String(dados.get('scheduledAt') ?? '');
    setEnviando(true);
    setErro(null);
    setOk(false);
    try {
      await apiFetch(`/doctors/patients/${encodeURIComponent(pacienteId)}/appointment`, {
        method: 'PUT',
        // datetime-local não tem fuso: o navegador converte para ISO no horário local.
        body: { scheduledAt: new Date(quando).toISOString(), notes: dados.get('notes') },
      });
      setOk(true);
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível agendar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={agendar} className="space-y-3">
      <div>
        <label htmlFor="quando" className="mb-1 block text-sm font-medium">Data e hora da próxima consulta</label>
        <input id="quando" name="scheduledAt" type="datetime-local" required className={CAMPO} />
      </div>
      <div>
        <label htmlFor="obsAgenda" className="mb-1 block text-sm font-medium">Observação (opcional)</label>
        <input id="obsAgenda" name="notes" maxLength={300} placeholder="Ex.: Retorno com revisão de exames" className={CAMPO} />
      </div>
      <button type="submit" disabled={enviando} className="rounded-lg bg-brand px-5 py-2 font-medium text-white disabled:opacity-60">
        {enviando ? 'Salvando…' : 'Agendar consulta'}
      </button>
      {ok && <p role="status" className="text-sm text-green-700">Consulta agendada. A paciente já pode ver.</p>}
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    </form>
  );
}
