import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import { serverApi } from '@/lib/api-server';
import { ApiError } from '@/lib/api-client';
import { formatarDataHora } from '@/lib/formatar';

// Dados que o back-end devolve para a solicitação (acesso é checado lá: médica ou dona da solicitação).
interface SolicitacaoPdf {
  id: string;
  name: string;
  notes: string | null;
  requestedBy: string;
  createdAt: string;
  patientName: string;
  clinicName: string;
}

const A4: [number, number] = [595, 842];
const MARGEM = 56;

/** Quebra o texto em linhas que cabem na largura informada. */
function quebrar(texto: string, fonte: PDFFont, tamanho: number, largura: number): string[] {
  const linhas: string[] = [];
  for (const paragrafo of texto.split('\n')) {
    let atual = '';
    for (const palavra of paragrafo.split(' ')) {
      const teste = atual ? `${atual} ${palavra}` : palavra;
      if (fonte.widthOfTextAtSize(teste, tamanho) > largura && atual) {
        linhas.push(atual);
        atual = palavra;
      } else {
        atual = teste;
      }
    }
    linhas.push(atual);
  }
  return linhas;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let dados: SolicitacaoPdf;
  try {
    dados = await serverApi<SolicitacaoPdf>(`/exam-requests/${encodeURIComponent(id)}`);
  } catch (err) {
    const status = err instanceof ApiError && err.status === 403 ? 403 : 401;
    return new Response('Acesso negado.', { status });
  }

  const pdf = await PDFDocument.create();
  const pagina: PDFPage = pdf.addPage(A4);
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const negrito = await pdf.embedFont(StandardFonts.HelveticaBold);
  const largura = A4[0] - MARGEM * 2;
  const cinza = rgb(0.4, 0.4, 0.45);
  let y = A4[1] - MARGEM;

  const escrever = (texto: string, fonte: PDFFont, tamanho: number, cor = rgb(0.15, 0.15, 0.18)) => {
    for (const linha of quebrar(texto, fonte, tamanho, largura)) {
      pagina.drawText(linha, { x: MARGEM, y, size: tamanho, font: fonte, color: cor });
      y -= tamanho * 1.45;
    }
  };

  escrever(dados.clinicName, negrito, 13, rgb(0.06, 0.46, 0.43));
  y -= 10;
  escrever('Solicitação de exame', negrito, 20);
  y -= 16;
  escrever(`Paciente: ${dados.patientName}`, normal, 11);
  escrever(`Solicitado por: ${dados.requestedBy}`, normal, 11);
  escrever(`Data: ${formatarDataHora(dados.createdAt)}`, normal, 11);
  y -= 18;
  escrever('Exame solicitado', negrito, 12);
  y -= 4;
  escrever(dados.name, normal, 14);
  if (dados.notes) {
    y -= 6;
    escrever('Orientações', negrito, 12);
    y -= 4;
    escrever(dados.notes, normal, 11);
  }

  pagina.drawText(`Documento gerado pela plataforma FemmeCare em ${formatarDataHora(new Date().toISOString())}.`, {
    x: MARGEM,
    y: MARGEM,
    size: 9,
    font: normal,
    color: cinza,
  });

  const bytes = await pdf.save();
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="solicitacao-${id}.pdf"`,
    },
  });
}
