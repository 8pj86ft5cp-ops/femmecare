import { formatarData } from '@/lib/formatar';
import { Secao } from '@/components/Secao';
import type { Journey } from '@/lib/types';

const TRIMESTRE: Record<number, string> = { 1: '1º trimestre', 2: '2º trimestre', 3: '3º trimestre' };

/** Somente leitura. Os dados são registrados pela médica durante a consulta. */
export function CalculadoraCard({ journey }: { journey: Journey }) {
  return (
    <Secao titulo="Calculadora obstétrica" descricao="Dados registrados pela sua médica na consulta.">
      {!journey.dum || journey.weeks === null || journey.days === null ? (
        <p className="text-sm text-slate-500">
          Sua médica ainda não registrou a data da última menstruação. Ela aparecerá aqui depois da consulta.
        </p>
      ) : (
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-slate-500">DUM</dt>
            <dd className="font-medium text-slate-800">{formatarData(journey.dum)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">DPP estimada</dt>
            <dd className="font-medium text-slate-800">{journey.dpp ? formatarData(journey.dpp) : '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Idade gestacional</dt>
            <dd className="font-medium text-slate-800">{journey.weeks} semanas e {journey.days} dias</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Trimestre</dt>
            <dd className="font-medium text-slate-800">{journey.trimester ? TRIMESTRE[journey.trimester] : '—'}</dd>
          </div>
        </dl>
      )}
      <p className="rounded-lg bg-brand-soft p-3 text-xs text-slate-600">
        Estimativa com base na DUM. A data definitiva é definida pela sua médica, geralmente com ultrassonografia.
      </p>
    </Secao>
  );
}
