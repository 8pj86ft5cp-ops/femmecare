import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { AuditEntry, Doctor, Metrics, PatientDeletionRequest, Tenant } from '@/lib/types';
import { Auditoria } from './Auditoria';
import { SolicitacoesExclusao } from './SolicitacoesExclusao';
import { CorpoMedico } from './CorpoMedico';
import { TenantForm } from './TenantForm';

export default async function AdminPage() {
  await requirePapel('ADMIN');

  const [metricas, tenant, medicos, auditoria, pedidosExclusao] = await Promise.all([
    serverApi<Metrics>('/admin/metrics'),
    serverApi<Tenant>('/tenant/public'),
    serverApi<Doctor[]>('/admin/doctors'),
    serverApi<AuditEntry[]>('/admin/audit-log'),
    serverApi<PatientDeletionRequest[]>('/admin/deletion-requests'),
  ]);

  const indicadores = [
    { rotulo: 'Gestantes ativas', valor: metricas.activePatients },
    { rotulo: 'Médicos', valor: metricas.doctors },
    { rotulo: 'Uso no último mês', valor: `${metricas.monthlyUsageRate}%` },
    { rotulo: 'Retenção', valor: `${metricas.retentionRate}%` },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Painel da clínica</h1>

      <section className="grid gap-4 md:grid-cols-4">
        {indicadores.map((i) => (
          <div key={i.rotulo} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{i.rotulo}</p>
            <p className="mt-1 text-2xl font-bold">{i.valor}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Domínio do site</p>
        <p className="mt-1 font-mono text-sm">{tenant.domain}</p>
        <p className="mt-2 text-xs text-slate-500">
          O domínio é configurado pela equipe técnica na infraestrutura e não pode ser alterado por este painel.
        </p>
      </section>

      <TenantForm inicial={tenant} />
      <CorpoMedico inicial={medicos} />
      <SolicitacoesExclusao pedidos={pedidosExclusao} />
      <Auditoria registros={auditoria} />
    </div>
  );
}
