import { DocumentoLista } from '@/components/DocumentoLista';
import { Secao } from '@/components/Secao';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { Documento } from '@/lib/types';

export default async function ResultadosPage() {
  await requirePapel('PATIENT');
  const documentos = await serverApi<Documento[]>('/patients/me/documents?type=LAB_RESULT');

  return (
    <Secao titulo="Resultados de exames" descricao="Resultados enviados pela sua equipe.">
      <DocumentoLista documentos={documentos} vazio="Nenhum resultado disponível ainda." />
    </Secao>
  );
}
