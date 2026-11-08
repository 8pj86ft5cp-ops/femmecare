import { Secao } from '@/components/Secao';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { BirthPlanChecklistItem } from '@/lib/types';
import { ChecklistPaciente } from './ChecklistPaciente';

export default async function PlanoDePartoPage() {
  await requirePapel('PATIENT');
  const itens = await serverApi<BirthPlanChecklistItem[]>('/patients/me/birth-plan-checklist');

  return (
    <Secao titulo="Plano de parto e maternidade" descricao="Uma lista de preparação para conversar com sua equipe.">
      <ChecklistPaciente inicial={itens} />
    </Secao>
  );
}
