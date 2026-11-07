import { formatarData } from '@/lib/formatar';
import type { Journey } from '@/lib/types';

const ETAPA: Record<Journey['stage'], string> = {
  PRE_CONCEPTION: 'Pré-concepção',
  PRENATAL: 'Pré-natal',
  POSTPARTUM: 'Pós-parto',
};

export function JornadaCard({ journey }: { journey: Journey }) {
  const progresso = Math.min(100, Math.max(0, journey.progressPercent ?? 0));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{ETAPA[journey.stage]}</p>

      {journey.weeks !== null && journey.days !== null ? (
        <>
          <h1 className="mt-1 text-2xl font-bold">
            {journey.weeks} semanas e {journey.days} dias
          </h1>
          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-brand-soft"
            role="progressbar"
            aria-valuenow={Math.round(progresso)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full bg-brand" style={{ width: `${progresso}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {Math.round(progresso)}% da gestação
            {journey.dpp && <> · DPP estimada: {formatarData(journey.dpp)}</>}
          </p>
        </>
      ) : (
        <h1 className="mt-1 text-2xl font-bold">Sua jornada</h1>
      )}
    </section>
  );
}
