import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { Journey, SymptomLog } from '@/lib/types';
import { AssistenteIA } from './AssistenteIA';
import { CalculadoraCard } from './CalculadoraCard';
import { ContadorChutes } from './ContadorChutes';
import { DiarioSintomas } from './DiarioSintomas';
import { JornadaCard } from './JornadaCard';

export default async function CadernoPage() {
  await requirePapel('PATIENT');

  const [journey, sintomas] = await Promise.all([
    serverApi<Journey>('/patients/me/journey'),
    serverApi<SymptomLog[]>('/patients/me/symptoms'),
  ]);

  // O contador de movimentos fetais é indicado a partir do 2º trimestre.
  const mostrarContador = journey.trimester !== null && journey.trimester >= 2;

  return (
    <div className="space-y-6">
      <JornadaCard journey={journey} />
      <CalculadoraCard journey={journey} />
      <DiarioSintomas historico={sintomas} />
      {mostrarContador && <ContadorChutes />}
      <AssistenteIA />
    </div>
  );
}
