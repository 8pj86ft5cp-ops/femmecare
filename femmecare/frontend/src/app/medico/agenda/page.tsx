import Link from 'next/link';
import { Secao } from '@/components/Secao';
import { formatarDataHora } from '@/lib/formatar';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { DoctorAppointment } from '@/lib/types';

function dataHoje() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

export default async function AgendaMedicaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  await requirePapel('DOCTOR');
  const { data: dataInformada } = await searchParams;
  const data = dataInformada && /^\d{4}-\d{2}-\d{2}$/.test(dataInformada) ? dataInformada : dataHoje();
  const consultas = await serverApi<DoctorAppointment[]>(
    `/doctors/appointments?date=${encodeURIComponent(data)}`,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda do dia</h1>
          <p className="mt-1 text-sm text-slate-600">Consultas de todas as pacientes nesta data.</p>
        </div>
        <Link href="/medico" className="text-sm font-medium text-brand hover:underline">Voltar às pacientes</Link>
      </div>
      <form className="flex flex-wrap items-end gap-3 rounded-xl bg-[#fffdfb] p-4 shadow-sm">
        <div>
          <label htmlFor="data-agenda" className="mb-1 block text-xs font-medium text-slate-600">Data</label>
          <input id="data-agenda" name="data" type="date" defaultValue={data} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">Ver agenda</button>
      </form>
      <Secao titulo={`Consultas de ${data}`}>
        {consultas.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma consulta agendada para esta data.</p>
        ) : (
          <ol className="space-y-3">
            {consultas.map((consulta) => (
              <li key={`${consulta.patientId}-${consulta.scheduledAt}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5eee3] bg-white p-4">
                <div>
                  <p className="font-semibold text-slate-800">{formatarDataHora(consulta.scheduledAt)}</p>
                  <p className="text-sm text-slate-600">{consulta.patientName}</p>
                  {consulta.notes && <p className="mt-1 text-sm text-slate-500">{consulta.notes}</p>}
                </div>
                <Link href={`/medico/${encodeURIComponent(consulta.patientId)}`} className="rounded-lg bg-[#dcebdc] px-3 py-2 text-sm font-medium text-[#456b49]">
                  Abrir prontuário
                </Link>
              </li>
            ))}
          </ol>
        )}
      </Secao>
    </div>
  );
}
