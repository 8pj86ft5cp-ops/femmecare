'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { PatientSummary } from '@/lib/types';

export function BuscaPacientes({
  pacientes,
  riscoInicial,
}: {
  pacientes: PatientSummary[];
  riscoInicial: string;
}) {
  const [busca, setBusca] = useState('');
  const [semanas, setSemanas] = useState('');
  const [risco, setRisco] = useState(riscoInicial);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    const semanasAlvo = semanas === '' ? null : Number(semanas);
    return pacientes.filter((paciente) => {
      const correspondeAoTexto =
        !termo ||
        paciente.name.toLocaleLowerCase('pt-BR').includes(termo) ||
        String(paciente.weeks ?? '').includes(termo);
      return correspondeAoTexto &&
        (semanasAlvo === null || paciente.weeks === semanasAlvo) &&
        (!risco || paciente.riskLevel === risco);
    });
  }, [busca, pacientes, risco, semanas]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl bg-[#fffdfb] p-4 shadow-sm sm:grid-cols-3">
        <div>
          <label htmlFor="busca-paciente" className="mb-1 block text-xs font-medium text-slate-600">Nome ou semana</label>
          <input id="busca-paciente" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar paciente" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="filtro-semanas" className="mb-1 block text-xs font-medium text-slate-600">Semana gestacional</label>
          <input id="filtro-semanas" type="number" min="0" max="45" value={semanas} onChange={(e) => setSemanas(e.target.value)} placeholder="Qualquer semana" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="filtro-risco" className="mb-1 block text-xs font-medium text-slate-600">Risco</label>
          <select id="filtro-risco" value={risco} onChange={(e) => setRisco(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Todos</option>
            <option value="LOW">Habitual</option>
            <option value="HIGH">Alto risco</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-slate-500" aria-live="polite">
        {filtradas.length} {filtradas.length === 1 ? 'paciente encontrada' : 'pacientes encontradas'}
      </p>
      {filtradas.length === 0 ? (
        <p className="rounded-xl bg-[#fffdfb] p-5 text-sm text-slate-500">Nenhuma paciente corresponde aos filtros.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtradas.map((paciente) => (
            <li key={paciente.id}>
              <Link href={`/medico/${paciente.id}`} className="flex items-center justify-between rounded-xl bg-[#fffdfb] p-4 shadow-sm hover:ring-2 hover:ring-brand">
                <div>
                  <p className="font-medium">{paciente.name}</p>
                  <p className="text-sm text-slate-500">{paciente.weeks !== null ? `${paciente.weeks} semanas` : 'Pré-concepção'}</p>
                </div>
                {paciente.riskLevel === 'HIGH' && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">Alto risco</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
