import Link from 'next/link';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { AlertItem, PatientSummary } from '@/lib/types';
import { AlertasAoVivo } from './AlertasAoVivo';

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
    serverApi<PatientSummary[]>(soAltoRisco ? '/doctors/patients?risk=HIGH' : '/doctors/patients'),
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
          <div className="flex gap-3 text-sm">
            <Link href="/medico" className={!soAltoRisco ? 'font-semibold text-brand' : 'text-slate-600'}>
              Todas
            </Link>
            <Link href="/medico?risco=HIGH" className={soAltoRisco ? 'font-semibold text-brand' : 'text-slate-600'}>
              Alto risco
            </Link>
          </div>
        </div>

        <ul className="grid gap-3 md:grid-cols-2">
          {ordenadas.map((p) => (
            <li key={p.id}>
              <Link
                href={`/medico/${p.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:ring-2 hover:ring-brand"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-slate-500">
                    {p.weeks !== null ? `${p.weeks} semanas` : 'Pré-concepção'}
                  </p>
                </div>
                {p.riskLevel === 'HIGH' && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                    Alto risco
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
