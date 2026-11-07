import { PressaoForm } from '@/components/PressaoForm';
import { Secao } from '@/components/Secao';
import { formatarDataHora } from '@/lib/formatar';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { BloodPressureReading } from '@/lib/types';

export default async function PressaoPage() {
  await requirePapel('PATIENT');
  const leituras = await serverApi<BloodPressureReading[]>('/patients/me/blood-pressure');

  return (
    <div className="space-y-6">
      <Secao titulo="Registrar pressão" descricao="Você pode medir em casa e registrar aqui. Valores de risco são enviados à sua equipe na hora.">
        <PressaoForm endpoint="/patients/me/blood-pressure" mostrarAlerta />
      </Secao>
      <Secao titulo="Histórico">
        {leituras.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma medição registrada ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leituras.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-800">
                    {l.systolic}/{l.diastolic} mmHg
                    {l.dangerous && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Faixa de risco</span>}
                  </p>
                  <p className="text-xs text-slate-500">{l.source === 'MEDICO' ? 'Medida pela médica' : 'Medida pela paciente'}</p>
                </div>
                <span className="text-xs text-slate-500">{formatarDataHora(l.measuredAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Secao>
    </div>
  );
}
