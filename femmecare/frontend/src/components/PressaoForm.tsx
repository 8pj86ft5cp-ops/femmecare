'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { EmergenciaAlerta } from '@/components/EmergenciaAlerta';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { BloodPressureResult } from '@/lib/types';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

/**
 * Usado pela paciente e pela médica. Só a paciente vê o alerta de emergência.
 * O aviso à médica é registrado no back-end. O alarme externo (SMS, push) ainda não está ligado.
 */
export function PressaoForm({ endpoint, mostrarAlerta }: { endpoint: string; mostrarAlerta: boolean }) {
  const router = useRouter();
  const [sistolica, setSistolica] = useState('');
  const [diastolica, setDiastolica] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<BloodPressureResult | null>(null);

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const r = await apiFetch<BloodPressureResult>(endpoint, {
        method: 'POST',
        body: { systolic: Number(sistolica), diastolic: Number(diastolica) },
      });
      setResultado(r);
      setSistolica('');
      setDiastolica('');
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível registrar a pressão.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={registrar} className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="sistolica" className="mb-1 block text-sm font-medium">Sistólica (mmHg)</label>
          <input id="sistolica" type="number" min={60} max={260} required value={sistolica} onChange={(e) => setSistolica(e.target.value)} className={CAMPO} />
        </div>
        <div>
          <label htmlFor="diastolica" className="mb-1 block text-sm font-medium">Diastólica (mmHg)</label>
          <input id="diastolica" type="number" min={30} max={160} required value={diastolica} onChange={(e) => setDiastolica(e.target.value)} className={CAMPO} />
        </div>
        <div className="col-span-2">
          <button type="submit" disabled={enviando} className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60">
            {enviando ? 'Registrando…' : 'Registrar pressão'}
          </button>
        </div>
      </form>

      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}

      {resultado?.dangerous && mostrarAlerta && (
        <EmergenciaAlerta mensagem="Sua pressão está em faixa de risco. Procure atendimento agora. O registro foi enviado à sua equipe." />
      )}
      {resultado && !resultado.dangerous && (
        <p role="status" className="text-sm text-slate-600">Pressão registrada.</p>
      )}
    </div>
  );
}
