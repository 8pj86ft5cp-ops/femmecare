import Link from 'next/link';
import { DocumentoLista } from '@/components/DocumentoLista';
import { PressaoForm } from '@/components/PressaoForm';
import { Secao } from '@/components/Secao';
import { serverApi } from '@/lib/api-server';
import { formatarData, formatarDataHora, formatarVitals } from '@/lib/formatar';
import { requirePapel } from '@/lib/session';
import type {
  Appointment,
  BloodPressureReading,
  Documento,
  ExamRequest,
  MedicalRecord,
  PatientSummary,
  Prescription,
  PrescriptionStatus,
  BirthPlanChecklistItem,
} from '@/lib/types';
import { AgendaForm } from './AgendaForm';
import { DocumentoForm } from './DocumentoForm';
import { GestacaoForm } from './GestacaoForm';
import { PrescricaoForm } from './PrescricaoForm';
import { RegistroForm } from './RegistroForm';
import { SolicitacaoForm } from './SolicitacaoForm';

const STATUS_PRESCRICAO: Record<PrescriptionStatus, string> = {
  DRAFT: 'Rascunho · sem validade jurídica',
  ISSUED: 'Emitida',
  SIGNED: 'Assinada digitalmente',
  CANCELLED: 'Cancelada',
};

export default async function PacienteDetalhe({ params }: { params: Promise<{ id: string }> }) {
  await requirePapel('DOCTOR');
  const { id } = await params;
  const base = `/doctors/patients/${encodeURIComponent(id)}`;

  // Cada leitura de prontuário é registrada no audit_log pelo back-end.
  const [paciente, evolucoes, prescricoes, solicitacoes, documentos, consulta, pressoes, checklist] = await Promise.all([
    serverApi<PatientSummary>(base),
    serverApi<MedicalRecord[]>(`${base}/records`),
    serverApi<Prescription[]>(`${base}/prescriptions`),
    serverApi<ExamRequest[]>(`${base}/exam-requests`),
    serverApi<Documento[]>(`${base}/documents`),
    serverApi<Appointment | null>(`${base}/appointment`),
    serverApi<BloodPressureReading[]>(`${base}/blood-pressure`),
    serverApi<BirthPlanChecklistItem[]>(`${base}/birth-plan-checklist`),
  ]);

  const documentosMedicos = documentos.filter((d) => d.type !== 'PATIENT_EXAM');

  return (
    <div className="space-y-6">
      <div>
        <Link href="/medico" className="text-sm text-slate-500 hover:text-brand">← Pacientes</Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">{paciente.name}</h1>
        <p className="text-sm text-slate-500">
          {paciente.weeks !== null ? `${paciente.weeks} semanas` : 'Pré-concepção'}
          {paciente.riskLevel === 'HIGH' && ' · Alto risco'}
          {paciente.dum && ` · DUM ${formatarData(paciente.dum)}`}
        </p>
      </div>

      <Secao titulo="Gestação e calculadora" descricao="Registre a DUM. A paciente vê a DPP e a idade gestacional no caderno.">
        <GestacaoForm pacienteId={id} dumAtual={paciente.dum} />
      </Secao>

      <Secao titulo="Solicitações de exame" descricao="Os pedidos aparecem para a paciente, que envia os resultados pela aba Enviar docs.">
        <SolicitacaoForm pacienteId={id} />
        {solicitacoes.length === 0 && <p className="text-sm text-slate-500">Nenhuma solicitação ainda.</p>}
        <ul className="space-y-3">
          {solicitacoes.map((s) => {
            const enviados = documentos.filter((d) => d.examRequestId === s.id);
            return (
              <li key={s.id} className="space-y-3 rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">{s.name}</p>
                    {s.notes && <p className="text-sm text-slate-600">{s.notes}</p>}
                    <p className="text-xs text-slate-500">
                      {formatarDataHora(s.createdAt)} ·{' '}
                      <span className={s.status === 'UPLOADED' ? 'text-green-700' : 'text-amber-700'}>
                        {s.status === 'UPLOADED' ? 'Enviado pela paciente' : 'Aguardando envio'}
                      </span>
                    </p>
                  </div>
                  <a href={`/pdf/solicitacao/${s.id}`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-brand hover:bg-brand-soft">
                    Baixar PDF
                  </a>
                </div>
                {enviados.length > 0 && <DocumentoLista documentos={enviados} vazio="" />}
              </li>
            );
          })}
        </ul>
      </Secao>

      <Secao titulo="Próxima consulta" descricao="A data definida aparece na agenda da paciente.">
        {consulta && (
          <p className="text-sm text-slate-700">
            Atual: <strong>{formatarDataHora(consulta.scheduledAt)}</strong>
            {consulta.notes && ` · ${consulta.notes}`}
          </p>
        )}
        <AgendaForm pacienteId={id} />
      </Secao>

      <Secao titulo="Plano de parto e maternidade" descricao="Checklist atualizado pela paciente.">
        {checklist.filter((item) => item.checked).length} de {checklist.length} itens concluídos
        <ul className="mt-3 space-y-2">
          {checklist.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm text-slate-700">
              <span aria-hidden="true" className={item.checked ? 'font-bold text-green-700' : 'text-slate-400'}>
                {item.checked ? '✓' : '○'}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Ultrassom e resultados" descricao="Arquivos enviados aqui ficam disponíveis para a paciente.">
        <DocumentoForm pacienteId={id} />
        <DocumentoLista documentos={documentosMedicos} vazio="Nenhum arquivo enviado ainda." />
      </Secao>

      <Secao titulo="Pressão arterial" descricao="Medições feitas pela equipe ou pela paciente.">
        <PressaoForm endpoint={`${base}/blood-pressure`} mostrarAlerta={false} />
        <ul className="divide-y divide-slate-100">
          {pressoes.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="font-medium text-slate-800">
                {l.systolic}/{l.diastolic} mmHg
                {l.dangerous && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800">Faixa de risco</span>}
              </span>
              <span className="text-xs text-slate-500">
                {l.source === 'MEDICO' ? 'Medida pela equipe' : 'Medida pela paciente'} · {formatarDataHora(l.measuredAt)}
              </span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Nova evolução" descricao="Registre a consulta e os sinais vitais.">
        <RegistroForm pacienteId={id} />
      </Secao>

      <Secao titulo="Receita" descricao="Salva como rascunho. A emissão com assinatura digital será feita em fase posterior.">
        <PrescricaoForm pacienteId={id} />
        {prescricoes.map((rx) => (
          <article key={rx.id} className="rounded-xl border border-slate-100 p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-500">
              <span>{rx.doctorName}</span>
              <span>{formatarDataHora(rx.createdAt)}</span>
            </div>
            <p className="mt-1 text-xs font-medium text-amber-800">{STATUS_PRESCRICAO[rx.status]}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{rx.content}</p>
          </article>
        ))}
      </Secao>

      <Secao titulo="Evolução clínica">
        {evolucoes.length === 0 && <p className="text-sm text-slate-500">Nenhum registro ainda.</p>}
        {evolucoes.map((r) => (
          <article key={r.id} className="rounded-xl border border-slate-100 p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-500">
              <span>{r.doctorName}</span>
              <span>{formatarDataHora(r.createdAt)}</span>
            </div>
            <h3 className="mt-1 font-semibold text-slate-800">{r.title}</h3>
            {formatarVitals(r.vitals).length > 0 && (
              <p className="mt-2 flex flex-wrap gap-2">
                {formatarVitals(r.vitals).map((item) => (
                  <span key={item} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-slate-700">{item}</span>
                ))}
              </p>
            )}
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{r.notes}</p>
          </article>
        ))}
      </Secao>
    </div>
  );
}
