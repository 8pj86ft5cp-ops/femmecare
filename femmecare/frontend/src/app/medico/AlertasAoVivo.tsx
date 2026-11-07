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

  // Consulta periódica. Em produção, o back-end pode trocar isso por SSE ou WebSocket.
  useEffect(() => {
    let ativo = true;
    async function buscar() {
      try {
        const dados = await apiFetch<AlertItem[]>('/doctors/alerts');
        if (!ativo) return;
        setAlertas(dados);
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
            <li key={a.id} className="rounded-xl border border-red-200 bg-red-50 p-4">
              <a href={`/medico/${a.patientId}`} className="font-medium text-red-900 hover:underline">
                {a.patientName}
              </a>
              <p className="text-sm text-red-900">{a.symptom}</p>
              <p className="text-xs text-red-800">{formatarDataHora(a.loggedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
