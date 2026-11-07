import { Secao } from '@/components/Secao';
import { formatarDataHora } from '@/lib/formatar';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { Appointment } from '@/lib/types';

export default async function AgendaPage() {
  await requirePapel('PATIENT');
  const consulta = await serverApi<Appointment | null>('/patients/me/appointment');

  return (
    <Secao titulo="Próxima consulta" descricao="A data e a hora são definidas pela sua médica.">
      {consulta ? (
        <div className="space-y-2">
          <p className="text-2xl font-bold text-slate-800">{formatarDataHora(consulta.scheduledAt)}</p>
          <p className="text-sm text-slate-600">Com {consulta.doctorName}</p>
          {consulta.notes && <p className="rounded-lg bg-brand-soft p-3 text-sm text-slate-700">{consulta.notes}</p>}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Sua médica ainda não agendou a próxima consulta.</p>
      )}
    </Secao>
  );
}
