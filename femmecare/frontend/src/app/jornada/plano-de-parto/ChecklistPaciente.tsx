'use client';

import { useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { BirthPlanChecklistItem } from '@/lib/types';

export function ChecklistPaciente({ inicial }: { inicial: BirthPlanChecklistItem[] }) {
  const [itens, setItens] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<string | null>(null);

  async function alternar(item: BirthPlanChecklistItem) {
    setSalvando(item.id);
    setErro(null);
    try {
      await apiFetch<BirthPlanChecklistItem>('/patients/me/birth-plan-checklist', {
        method: 'PUT',
        body: { itemId: item.id, checked: !item.checked },
      });
      setItens((atuais) => atuais.map((atual) => (
        atual.id === item.id ? { ...atual, checked: !atual.checked } : atual
      )));
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível salvar este item.');
    } finally {
      setSalvando(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">Marque o que já preparou. Sua equipe também pode acompanhar esta lista.</p>
      <ul className="space-y-2">
        {itens.map((item) => (
          <li key={item.id}>
            <label className="flex items-start gap-3 rounded-xl border border-[#e5eee3] bg-white p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={item.checked}
                disabled={salvando !== null}
                onChange={() => void alternar(item)}
                className="mt-0.5 h-4 w-4 accent-[#58765b]"
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
      {salvando && <p role="status" className="text-xs text-slate-500">Salvando…</p>}
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    </div>
  );
}
