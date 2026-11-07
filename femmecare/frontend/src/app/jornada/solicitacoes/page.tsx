import { Secao } from '@/components/Secao';
import { formatarDataHora } from '@/lib/formatar';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { ExamRequest } from '@/lib/types';

export default async function SolicitacoesPage() {
  await requirePapel('PATIENT');
  const solicitacoes = await serverApi<ExamRequest[]>('/patients/me/exam-requests');

  return (
    <Secao titulo="Solicitações de exame" descricao="Exames pedidos pela sua médica. Para enviar o resultado, use a aba Enviar docs.">
      {solicitacoes.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma solicitação de exame ainda.</p>
      ) : (
        <ul className="space-y-3">
          {solicitacoes.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4">
              <div>
                <p className="font-medium text-slate-800">{s.name}</p>
                {s.notes && <p className="text-sm text-slate-600">{s.notes}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  {s.requestedBy} · {formatarDataHora(s.createdAt)} ·{' '}
                  <span className={s.status === 'UPLOADED' ? 'text-green-700' : 'text-amber-700'}>
                    {s.status === 'UPLOADED' ? 'Enviado' : 'Aguardando envio'}
                  </span>
                </p>
              </div>
              <a href={`/pdf/solicitacao/${s.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-brand hover:bg-brand-soft">
                Baixar PDF
              </a>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
