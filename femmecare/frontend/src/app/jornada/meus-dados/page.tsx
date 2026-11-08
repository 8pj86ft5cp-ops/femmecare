import { Secao } from '@/components/Secao';
import { requirePapel } from '@/lib/session';
import { MeusDados } from './MeusDados';

export default async function MeusDadosPage() {
  await requirePapel('PATIENT');

  return (
    <Secao titulo="Meus dados" descricao="Acesse seus dados e exerça seus direitos de privacidade.">
      <MeusDados />
    </Secao>
  );
}
