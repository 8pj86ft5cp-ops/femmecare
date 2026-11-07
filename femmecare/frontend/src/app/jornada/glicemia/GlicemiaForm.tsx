'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function GlicemiaForm() {
  const router = useRouter();
  const [valor, setValor] = useState('');
  const [contexto, setContexto] = useState('JEJUM');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await apiFetch('/patients/me/glucose', { method: 'POST', body: { value: Number(valor), context: contexto } });
      setValor('');
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível registrar a glicemia.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={registrar} className="space-y-3">
      <div>
        <label htmlFor="valor" className="mb-1 block text-sm font-medium">Valor (mg/dL)</label>
        <input id="valor" type="number" min={20} max={600} required value={valor} onChange={(e) => setValor(e.target.value)} className={CAMPO} />
      </div>
      <div>
        <label htmlFor="contexto" className="mb-1 block text-sm font-medium">Quando foi medida</label>
        <select id="contexto" value={contexto} onChange={(e) => setContexto(e.target.value)} className={CAMPO}>
          <option value="JEJUM">Em jejum</option>
          <option value="POS_REFEICAO">Após refeição</option>
          <option value="ALEATORIA">Ao acaso</option>
        </select>
      </div>
      <button type="submit" disabled={enviando} className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60">
        {enviando ? 'Registrando…' : 'Registrar glicemia'}
      </button>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    </form>
  );
}
