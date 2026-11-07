import { formatarDataHora } from '@/lib/formatar';
import type { Documento, DocumentType } from '@/lib/types';

const ROTULO: Record<DocumentType, string> = {
  ULTRASOUND: 'Ultrassom',
  LAB_RESULT: 'Resultado',
  PATIENT_EXAM: 'Enviado pela paciente',
};

export function DocumentoLista({ documentos, vazio }: { documentos: Documento[]; vazio: string }) {
  if (documentos.length === 0) return <p className="text-sm text-slate-500">{vazio}</p>;

  return (
    <ul className="space-y-3">
      {documentos.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4">
          <div>
            <p className="font-medium text-slate-800">{d.name}</p>
            <p className="text-xs text-slate-500">
              {ROTULO[d.type]} · {d.uploadedBy} · {formatarDataHora(d.createdAt)}
            </p>
          </div>
          <a href={`/api/documents/${d.id}/download`} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-brand hover:bg-brand-soft">
            Baixar
          </a>
        </li>
      ))}
    </ul>
  );
}
