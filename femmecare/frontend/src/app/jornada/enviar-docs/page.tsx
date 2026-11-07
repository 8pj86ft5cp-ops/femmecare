import { Secao } from '@/components/Secao';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { ExamRequest } from '@/lib/types';
import { EnviarDocsForm } from './EnviarDocsForm';

export default async function EnviarDocsPage() {
  await requirePapel('PATIENT');
  const solicitacoes = await serverApi<ExamRequest[]>('/patients/me/exam-requests');
  const pendentes = solicitacoes.filter((s) => s.status === 'PENDING');

  if (pendentes.length === 0) {
    return (
      <Secao titulo="Enviar documentos" descricao="Envie aqui os exames pedidos pela sua médica.">
        <p className="text-sm text-slate-500">Nenhum exame aguardando envio.</p>
      </Secao>
    );
  }

  return (
    <div className="space-y-6">
      {pendentes.map((s) => (
        <Secao key={s.id} titulo={s.name} descricao={s.notes ?? 'Aceitamos PDF, JPG ou PNG de até 10 MB.'}>
          <EnviarDocsForm solicitacaoId={s.id} />
        </Secao>
      ))}
    </div>
  );
}
