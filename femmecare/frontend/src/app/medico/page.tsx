import Link from 'next/link';
import { requirePapel } from '@/lib/session';
import { serverApi } from '@/lib/api-server';
import type { AlertItem, PatientSummary } from '@/lib/types';
import { AlertasAoVivo } from './AlertasAoVivo';
import { BuscaPacientes } from './BuscaPacientes';

export default async function MedicoPage({
  searchParams,
}: {
  searchParams: Promise<{ risco?: string }>;
}) {
  await requirePapel('DOCTOR');
  const { risco } = await searchParams;
  const soAltoRisco = risco === 'HIGH';

  const [alertas, pacientes] = await Promise.all([
    serverApi<AlertItem[]>('/doctors/alerts'),
    serverApi<PatientSummary[]>('/doctors/patients'),
  ]);

  // Triagem: alto risco primeiro e, dentro de cada grupo, a gestante mais próxima do parto.
  // Pré-concepção (sem semanas) fica por último.
  const ordenadas = [...pacientes].sort(
    (a, b) =>
      (b.riskLevel === 'HIGH' ? 1 : 0) - (a.riskLevel === 'HIGH' ? 1 : 0) ||
      (b.weeks ?? -1) - (a.weeks ?? -1),
  );

  return (
    <div className="space-y-8">
      <AlertasAoVivo inicial={alertas} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Gestantes</h2>
            <p className="text-xs text-slate-500">Ordem: alto risco primeiro, depois a semana mais avançada.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/medico/nova-paciente" className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:opacity-90">
              Cadastrar paciente
            </Link>
            <Link href="/medico/agenda" className="rounded-lg bg-[#dcebdc] px-4 py-2 font-medium text-[#456b49]">
              Agenda do dia
            </Link>
            <div className="flex gap-3">
              <Link href="/medico" className={!soAltoRisco ? 'font-semibold text-brand' : 'text-slate-600'}>
                Todas
              </Link>
              <Link href="/medico?risco=HIGH" className={soAltoRisco ? 'font-semibold text-brand' : 'text-slate-600'}>
                Alto risco
              </Link>
            </div>
          </div>
        </div>

        <BuscaPacientes pacientes={ordenadas} riscoInicial={soAltoRisco ? 'HIGH' : ''} />
      </section>
    </div>
  );
}
