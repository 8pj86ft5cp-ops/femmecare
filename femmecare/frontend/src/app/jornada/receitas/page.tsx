import { Secao } from '@/components/Secao';
import { formatarDataHora } from '@/lib/formatar';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { Prescription, PrescriptionStatus } from '@/lib/types';

const ROTULO: Record<PrescriptionStatus, string> = {
  DRAFT: 'Rascunho',
  ISSUED: 'Emitida',
  SIGNED: 'Assinada digitalmente',
  CANCELLED: 'Cancelada',
};

export default async function ReceitasPage() {
  await requirePapel('PATIENT');
  const receitas = await serverApi<Prescription[]>('/patients/me/prescriptions');

  return (
    <Secao titulo="Receitas" descricao="Receitas emitidas pela sua médica.">
      {receitas.length === 0 ? (
        <p className="text-sm text-slate-500">Suas receitas aparecerão aqui quando forem emitidas pela sua médica.</p>
      ) : (
        <ul className="space-y-3">
          {receitas.map((rx) => (
            <li key={rx.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-500">
                <span>{rx.doctorName} · {ROTULO[rx.status]}</span>
                <span>{formatarDataHora(rx.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{rx.content}</p>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
