'use client';

import { useState, type FormEvent } from 'react';
import { EmergenciaAlerta } from '@/components/EmergenciaAlerta';
import { apiFetch } from '@/lib/api-client';
import type { AiAnswer } from '@/lib/types';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function AssistenteIA() {
  const [pergunta, setPergunta] = useState('');
  const [resposta, setResposta] = useState<AiAnswer | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function perguntar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pergunta.trim()) return;
    setEnviando(true);
    setErro(null);

    try {
      const r = await apiFetch<AiAnswer>('/ai/ask', {
        method: 'POST',
        body: { message: pergunta.trim() },
      });
      setResposta(r);
    } catch {
      setErro('Não foi possível obter resposta agora. Tente novamente mais tarde.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">FemmeAI</h2>
      <p className="rounded-lg bg-brand-soft p-3 text-xs text-slate-700">
        A FemmeAI esclarece dúvidas gerais. Ela não substitui a consulta e não indica medicamentos nem doses.
        Em caso de sintoma grave, procure atendimento imediato.
      </p>

      <form onSubmit={perguntar} className="space-y-3">
        <label htmlFor="pergunta" className="sr-only">Sua dúvida</label>
        <textarea
          id="pergunta"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Escreva sua dúvida"
          className={CAMPO}
        />
        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60"
        >
          {enviando ? 'Pensando…' : 'Perguntar'}
        </button>
      </form>

      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}

      {resposta && (
        <div className="space-y-3">
          {resposta.escalated && (
            <EmergenciaAlerta mensagem="Sua mensagem pode indicar um sintoma de alerta. Ela foi encaminhada à equipe." />
          )}
          <p className="whitespace-pre-wrap text-sm text-slate-800">{resposta.answer}</p>
        </div>
      )}
    </section>
  );
}
