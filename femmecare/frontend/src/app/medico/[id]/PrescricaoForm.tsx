'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function PrescricaoForm({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const dados = new FormData(formulario);
    setEnviando(true);
    setErro(null);
    try {
      await apiFetch(`/doctors/patients/${encodeURIComponent(pacienteId)}/prescriptions`, {
        method: 'POST',
        body: { content: dados.get('content') },
      });
      formulario.reset();
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a prescrição.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-3 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Nova prescrição</h2>
      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
        A prescrição é salva como rascunho e não tem validade jurídica. A emissão com assinatura digital ICP-Brasil será feita em fase posterior.
      </p>
      <textarea name="content" required rows={4} placeholder="Medicamento, dose, posologia e duração" className={CAMPO} />
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <button type="submit" disabled={enviando} className="rounded-lg bg-brand px-5 py-2 font-medium text-white disabled:opacity-60">
        {enviando ? 'Salvando…' : 'Salvar rascunho'}
      </button>
    </form>
  );
}
