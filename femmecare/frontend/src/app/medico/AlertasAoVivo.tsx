'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { formatarDataHora } from '@/lib/formatar';
import type { AlertItem } from '@/lib/types';

const INTERVALO_MS = 30_000;

export function AlertasAoVivo({ inicial }: { inicial: AlertItem[] }) {
  const [alertas, setAlertas] = useState(inicial);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [lendo, setLendo] = useState<string | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);

  // Consulta periódica. Em produção, o back-end pode trocar isso por SSE ou WebSocket.
  useEffect(() => {
    let ativo = true;
    async function buscar() {
      try {
        const dados = await apiFetch<AlertItem[]>('/doctors/alerts');
        if (!ativo) return;
        setAlertas(dados.filter((alerta) => !alerta.isRead));
        setAtualizadoEm(new Date());
        setFalhou(false);
      } catch {
        if (ativo) setFalhou(true);
      }
    }
    const id = window.setInterval(buscar, INTERVALO_MS);
    return () => {
      ativo = false;
      window.clearInterval(id);
    };
  }, []);

  async function marcarComoLido(id: string) {
    setLendo(id);
    setErroLeitura(null);
    try {
      await apiFetch<void>(`/doctors/alerts/${encodeURIComponent(id)}/read`, { method: 'POST', body: {} });
      setAlertas((atuais) => atuais.filter((alerta) => alerta.id !== id));
    } catch {
      setErroLeitura('Não foi possível marcar o alerta como lido. Tente novamente.');
    } finally {
      setLendo(null);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Alertas de sintomas</h1>
        <p className="text-xs text-slate-500">
          {falhou
            ? 'Não foi possível atualizar agora.'
            : atualizadoEm
              ? `Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })} · atualiza a cada 30 s`
              : 'Atualiza a cada 30 s'}
        </p>
      </div>

      {alertas.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum alerta pendente.</p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <div>
                <a href={`/medico/${a.patientId}`} className="font-medium text-red-900 hover:underline">
                  {a.patientName}
                </a>
                <p className="text-sm text-red-900">{a.symptom}</p>
                <p className="text-xs text-red-800">{formatarDataHora(a.loggedAt)}</p>
              </div>
              <button
                type="button"
                disabled={lendo !== null}
                onClick={() => void marcarComoLido(a.id)}
                className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 disabled:opacity-60"
              >
                {lendo === a.id ? 'Salvando…' : 'Marcar como lido'}
              </button>
            </li>
          ))}
        </ul>
      )}
      {erroLeitura && <p role="alert" className="text-sm text-red-700">{erroLeitura}</p>}
    </section>
  );
}
