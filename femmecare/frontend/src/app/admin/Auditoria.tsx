import { formatarDataHora } from '@/lib/formatar';
import type { AuditEntry } from '@/lib/types';

const ACAO: Record<string, string> = {
  READ: 'Consultou',
  EXPORT: 'Exportou dados',
  CREATE: 'Registrou',
  UPDATE: 'Atualizou',
  DELETE_REQUEST: 'Solicitou exclusão',
};

export function Auditoria({ registros }: { registros: AuditEntry[] }) {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Auditoria de acesso ao prontuário</h2>
        <p className="text-sm text-slate-500">Acessos e ações registrados para prestação de contas.</p>
      </div>
      {registros.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum acesso registrado ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th scope="col" className="py-2 pr-4">Quando</th>
                <th scope="col" className="py-2 pr-4">Profissional</th>
                <th scope="col" className="py-2 pr-4">Paciente</th>
                <th scope="col" className="py-2 pr-4">Ação</th>
                <th scope="col" className="py-2">Dados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.map((registro) => (
                <tr key={registro.id}>
                  <td className="py-3 pr-4 whitespace-nowrap">{formatarDataHora(registro.occurredAt)}</td>
                  <td className="py-3 pr-4">{registro.actorName}</td>
                  <td className="py-3 pr-4">{registro.patientName}</td>
                  <td className="py-3 pr-4">{ACAO[registro.action] ?? registro.action}</td>
                  <td className="py-3">{registro.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
