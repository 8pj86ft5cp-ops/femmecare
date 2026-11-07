'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

// Campos vazios viram null, para que o back-end saiba que a medida não foi feita.
const numero = (v: FormDataEntryValue | null) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : null);

export function RegistroForm({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Guarda a referência antes do await: o evento não fica disponível depois.
    const formulario = e.currentTarget;
    const dados = new FormData(formulario);
    setEnviando(true);
    setErro(null);

    try {
      await apiFetch(`/doctors/patients/${encodeURIComponent(pacienteId)}/records`, {
        method: 'POST',
        body: {
          title: dados.get('title'),
          notes: dados.get('notes'),
          vitals: {
            systolic: numero(dados.get('systolic')),
            diastolic: numero(dados.get('diastolic')),
            fetalHeartRate: numero(dados.get('fetalHeartRate')),
            weightKg: numero(dados.get('weightKg')),
          },
        },
      });
      formulario.reset();
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar a evolução.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Nova evolução</h2>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">Título</label>
        <input id="title" name="title" required maxLength={200} className={CAMPO} />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">Evolução</label>
        <textarea id="notes" name="notes" required rows={4} className={CAMPO} />
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Sinais vitais (opcional)</legend>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label htmlFor="systolic" className="mb-1 block text-xs text-slate-600">PA sistólica (mmHg)</label>
            <input id="systolic" name="systolic" type="number" min={60} max={260} className={CAMPO} />
          </div>
          <div>
            <label htmlFor="diastolic" className="mb-1 block text-xs text-slate-600">PA diastólica (mmHg)</label>
            <input id="diastolic" name="diastolic" type="number" min={30} max={160} className={CAMPO} />
          </div>
          <div>
            <label htmlFor="fetalHeartRate" className="mb-1 block text-xs text-slate-600">BCF (bpm)</label>
            <input id="fetalHeartRate" name="fetalHeartRate" type="number" min={80} max={220} className={CAMPO} />
          </div>
          <div>
            <label htmlFor="weightKg" className="mb-1 block text-xs text-slate-600">Peso (kg)</label>
            <input id="weightKg" name="weightKg" type="number" step="0.1" min={30} max={250} className={CAMPO} />
          </div>
        </div>
      </fieldset>

      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <button type="submit" disabled={enviando} className="rounded-lg bg-brand px-5 py-2 font-medium text-white disabled:opacity-60">
        {enviando ? 'Salvando…' : 'Salvar evolução'}
      </button>
    </form>
  );
}
