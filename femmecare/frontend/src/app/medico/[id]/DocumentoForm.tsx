'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import { LIMITE_ARQUIVO_BYTES, lerArquivoBase64, TIPOS_PACIENTE } from '@/lib/arquivos';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

/** Upload feito pela médica: ultrassom ou resultado de exame. A paciente vê na aba correspondente. */
export function DocumentoForm({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const dados = new FormData(formulario);
    const arquivo = (formulario.elements.namedItem('arquivo') as HTMLInputElement).files?.[0];
    if (!arquivo) return;
    if (arquivo.size > LIMITE_ARQUIVO_BYTES) {
      setErro('O arquivo deve ter até 10 MB.');
      return;
    }
    setEnviando(true);
    setErro(null);
    setOk(false);
    try {
      const contentBase64 = await lerArquivoBase64(arquivo);
      await apiFetch(`/doctors/patients/${encodeURIComponent(pacienteId)}/documents`, {
        method: 'POST',
        body: { type: dados.get('type'), name: arquivo.name, mimeType: arquivo.type, contentBase64 },
      });
      formulario.reset();
      setOk(true);
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar o arquivo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-3">
      <div>
        <label htmlFor="tipo" className="mb-1 block text-sm font-medium">Tipo</label>
        <select id="tipo" name="type" className={CAMPO}>
          <option value="ULTRASOUND">Ultrassom</option>
          <option value="LAB_RESULT">Resultado de exame</option>
        </select>
      </div>
      <input name="arquivo" type="file" accept={TIPOS_PACIENTE} required className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:text-brand" />
      <button type="submit" disabled={enviando} className="rounded-lg bg-brand px-5 py-2 font-medium text-white disabled:opacity-60">
        {enviando ? 'Enviando…' : 'Enviar para a paciente'}
      </button>
      {ok && <p role="status" className="text-sm text-green-700">Arquivo disponível para a paciente.</p>}
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    </form>
  );
}
