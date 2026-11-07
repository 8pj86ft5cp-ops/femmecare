'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

const DOIS_HORAS_EM_SEGUNDOS = 2 * 60 * 60;

function formatarTempo(segundos: number) {
  const min = Math.floor(segundos / 60).toString().padStart(2, '0');
  const seg = (segundos % 60).toString().padStart(2, '0');
  return `${min}:${seg}`;
}

function mensagemResultado(movimentos: number, duracao: number) {
  if (movimentos >= 10) return 'Você registrou 10 ou mais movimentos. Sessão salva.';
  if (duracao >= DOIS_HORAS_EM_SEGUNDOS) {
    return 'Menos de 10 movimentos em 2 horas. Entre em contato com a clínica agora.';
  }
  return 'Sessão salva. Continue acompanhando. Se não chegar a 10 movimentos em 2 horas, ligue para a clínica.';
}

export function ContadorChutes() {
  const [inicio, setInicio] = useState<number | null>(null);
  const [agora, setAgora] = useState(0);
  const [movimentos, setMovimentos] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  useEffect(() => {
    if (inicio === null) return;
    const id = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [inicio]);

  const decorrido = inicio === null ? 0 : Math.max(0, Math.floor((agora - inicio) / 1000));

  function iniciar() {
    const t = Date.now();
    setInicio(t);
    setAgora(t);
    setMovimentos(0);
    setResultado(null);
  }

  async function finalizar() {
    if (inicio === null) return;
    const duracao = Math.floor((Date.now() - inicio) / 1000);
    setSalvando(true);
    try {
      await apiFetch('/patients/me/kick-sessions', {
        method: 'POST',
        body: { startedAt: new Date(inicio).toISOString(), durationSeconds: duracao, kicks: movimentos },
      });
      setResultado(mensagemResultado(movimentos, duracao));
      setInicio(null);
    } catch {
      // Mantém a contagem em andamento para o usuário tentar salvar de novo.
      setResultado('Não foi possível salvar a sessão. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Contador de movimentos</h2>
      <p className="text-sm text-slate-600">A referência é de 10 movimentos em 2 horas.</p>

      {inicio === null ? (
        <button type="button" onClick={iniciar} className="w-full rounded-lg bg-brand py-3 font-medium text-white">
          Iniciar contagem
        </button>
      ) : (
        <>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold tabular-nums">{movimentos}</p>
            <p className="text-sm text-slate-500">Tempo: {formatarTempo(decorrido)}</p>
          </div>
          <button
            type="button"
            onClick={() => setMovimentos((m) => m + 1)}
            className="w-full rounded-lg bg-brand py-6 text-lg font-semibold text-white active:scale-[0.99]"
          >
            Movimento do bebê
          </button>
          <button
            type="button"
            onClick={finalizar}
            disabled={salvando}
            className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium disabled:opacity-60"
          >
            {salvando ? 'Salvando…' : 'Finalizar sessão'}
          </button>
        </>
      )}

      {resultado && <p role="status" className="text-sm text-slate-700">{resultado}</p>}
    </section>
  );
}
