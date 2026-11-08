import { formatarDataHora } from '@/lib/formatar';
import type { PatientDeletionRequest } from '@/lib/types';

export function SolicitacoesExclusao({ pedidos }: { pedidos: PatientDeletionRequest[] }) {
  return (
    <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Solicitações de exclusão de dados</h2>
        <p className="text-sm text-slate-500">Pedidos aguardando análise da clínica. Prontuários podem ter obrigações legais de guarda.</p>
      </div>
      {pedidos.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma solicitação pendente.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="font-medium text-slate-800">{pedido.patientName}</span>
              <span className="text-slate-500">Recebida em {formatarDataHora(pedido.createdAt)}</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">Pendente</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
