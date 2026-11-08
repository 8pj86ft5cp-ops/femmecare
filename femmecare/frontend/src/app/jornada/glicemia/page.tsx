import { Secao } from '@/components/Secao';
import { LineChart } from '@/components/LineChart';
import { formatarDataHora } from '@/lib/formatar';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { GlucoseContext, GlucoseReading } from '@/lib/types';
import { GlicemiaForm } from './GlicemiaForm';

const CONTEXTO: Record<GlucoseContext, string> = {
  JEJUM: 'Em jejum',
  POS_REFEICAO: 'Após refeição',
  ALEATORIA: 'Ao acaso',
};

export default async function GlicemiaPage() {
  await requirePapel('PATIENT');
  const medicoes = await serverApi<GlucoseReading[]>('/patients/me/glucose');

  return (
    <div className="space-y-6">
      <Secao titulo="Registrar glicemia" descricao="Meça em casa e registre o valor aqui.">
        <GlicemiaForm />
      </Secao>
      {medicoes.length > 0 && (
        <Secao titulo="Variação da glicemia" descricao="Gráfico das 14 medições mais recentes.">
          <LineChart
            title="Glicemia ao longo do tempo"
            unit="mg/dL"
            series={[{
              label: 'Glicemia',
              color: '#58765b',
              points: medicoes.slice().reverse().slice(-14).map((medicao) => ({
                label: new Date(medicao.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
                value: medicao.value,
              })),
            }]}
          />
        </Secao>
      )}
      <Secao titulo="Histórico">
        {medicoes.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma medição registrada ainda.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {medicoes.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-800">{g.value} mg/dL</p>
                  <p className="text-xs text-slate-500">{CONTEXTO[g.context]}</p>
                </div>
                <span className="text-xs text-slate-500">{formatarDataHora(g.measuredAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Secao>
    </div>
  );
}
