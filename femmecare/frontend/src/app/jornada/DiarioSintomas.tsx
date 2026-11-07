'use client';

import { useState, type FormEvent } from 'react';
import { EmergenciaAlerta } from '@/components/EmergenciaAlerta';
import { apiFetch } from '@/lib/api-client';
import { formatarDataHora } from '@/lib/formatar';
import type { Severity, SymptomLog } from '@/lib/types';

const GRAVIDADE: [Severity, string][] = [
  ['LEVE', 'Leve'],
  ['MODERADA', 'Moderada'],
  ['INTENSA', 'Intensa'],
];

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function DiarioSintomas({ historico: inicial }: { historico: SymptomLog[] }) {
  const [historico, setHistorico] = useState(inicial);
  const [texto, setTexto] = useState('');
  const [gravidade, setGravidade] = useState<Severity>('LEVE');
  const [alerta, setAlerta] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setErro(null);

    try {
      const novo = await apiFetch<SymptomLog>('/patients/me/symptoms', {
        method: 'POST',
        body: { symptom: texto.trim(), severity: gravidade },
      });
      setHistorico((atual) => [novo, ...atual]);
      if (novo.isAlert) setAlerta(true);
      setTexto('');
    } catch {
      setErro('Não foi possível salvar o registro. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Diário de sintomas</h2>

      {alerta && (
        <div className="space-y-2">
          <EmergenciaAlerta />
          <button type="button" onClick={() => setAlerta(false)} className="text-sm text-slate-600 underline">
            Entendi
          </button>
        </div>
      )}

      <form onSubmit={registrar} className="space-y-3">
        <label htmlFor="sintoma" className="sr-only">Descreva o sintoma</label>
        <textarea
          id="sintoma"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Descreva o que você está sentindo"
          className={CAMPO}
        />
        <div className="flex gap-3">
          <select
            aria-label="Intensidade"
            value={gravidade}
            onChange={(e) => setGravidade(e.target.value as Severity)}
            className={CAMPO}
          >
            {GRAVIDADE.map(([valor, rotulo]) => (
              <option key={valor} value={valor}>{rotulo}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={enviando}
            className="shrink-0 rounded-lg bg-brand px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {enviando ? 'Salvando…' : 'Registrar'}
          </button>
        </div>
      </form>

      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}

      <ul className="divide-y divide-slate-100">
        {historico.length === 0 && <li className="py-3 text-sm text-slate-500">Nenhum registro ainda.</li>}
        {historico.map((item) => (
          <li key={item.id} className="py-3">
            <p className="text-sm">{item.symptom}</p>
            <p className="text-xs text-slate-500">
              {formatarDataHora(item.loggedAt)} · {GRAVIDADE.find(([v]) => v === item.severity)?.[1]}
              {item.isAlert && ' · alerta enviado à equipe'}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
