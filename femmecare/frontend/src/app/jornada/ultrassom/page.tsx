import { DocumentoLista } from '@/components/DocumentoLista';
import { Secao } from '@/components/Secao';
import { serverApi } from '@/lib/api-server';
import { requirePapel } from '@/lib/session';
import type { Documento } from '@/lib/types';

export default async function UltrassomPage() {
  await requirePapel('PATIENT');
  const documentos = await serverApi<Documento[]>('/patients/me/documents?type=ULTRASOUND');

  return (
    <Secao titulo="Ultrassom" descricao="Exames de imagem realizados pela sua equipe.">
      <DocumentoLista documentos={documentos} vazio="Nenhum ultrassom disponível ainda." />
    </Secao>
  );
}
