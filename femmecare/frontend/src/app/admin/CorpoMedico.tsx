'use client';

import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { Doctor } from '@/lib/types';

const CAMPO = 'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none';

export function CorpoMedico({ inicial }: { inicial: Doctor[] }) {
  const [medicos, setMedicos] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  async function cadastrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formulario = e.currentTarget;
    const dados = new FormData(formulario);
    setEnviando(true);
    setMensagem(null);
    try {
      const novo = await apiFetch<Doctor>('/admin/doctors', {
        method: 'POST',
        body: {
          name: dados.get('name'),
          email: dados.get('email'),
          crm: dados.get('crm'),
          crmUf: dados.get('crmUf'),
          specialty: dados.get('specialty'),
        },
      });
      setMedicos((lista) => [...lista, novo]);
      formulario.reset();
      setMensagem({ tipo: 'ok', texto: `Médico cadastrado. Envie o acesso para ${novo.email}.` });
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err instanceof ApiError ? err.message : 'Não foi possível cadastrar.' });
    } finally {
      setEnviando(false);
    }
  }

  async function alternarAtivo(medico: Doctor) {
    setMensagem(null);
    try {
      const atualizado = await apiFetch<Doctor>(`/admin/doctors/${encodeURIComponent(medico.id)}`, {
        method: 'PATCH',
        body: { active: !medico.active },
      });
      setMedicos((lista) => lista.map((x) => (x.id === atualizado.id ? atualizado : x)));
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err instanceof ApiError ? err.message : 'Não foi possível alterar o acesso.' });
    }
  }

  return (
    <section className="space-y-6 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Corpo médico</h2>
        <p className="text-sm text-slate-500">Médicos com acesso ao painel de pacientes da clínica.</p>
      </div>

      <ul className="divide-y divide-slate-100">
        {medicos.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-slate-500">
                {m.specialty} · CRM {m.crm}/{m.crmUf} · {m.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${m.active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                {m.active ? 'Ativo' : 'Desativado'}
              </span>
              <button type="button" onClick={() => alternarAtivo(m)} className="text-sm text-slate-600 underline hover:text-brand">
                {m.active ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={cadastrar} className="space-y-4 border-t border-slate-100 pt-6">
        <h3 className="font-medium">Cadastrar médico</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">Nome completo</label>
            <input id="name" name="name" required maxLength={150} className={CAMPO} />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">E-mail</label>
            <input id="email" name="email" type="email" required className={CAMPO} />
          </div>
          <div>
            <label htmlFor="crm" className="mb-1 block text-sm font-medium">CRM</label>
            <input id="crm" name="crm" required maxLength={20} className={CAMPO} />
          </div>
          <div>
            <label htmlFor="crmUf" className="mb-1 block text-sm font-medium">UF do CRM</label>
            <input id="crmUf" name="crmUf" required maxLength={2} placeholder="AL" className={`${CAMPO} uppercase`} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="specialty" className="mb-1 block text-sm font-medium">Especialidade</label>
            <input id="specialty" name="specialty" required maxLength={100} defaultValue="Obstetrícia" className={CAMPO} />
          </div>
        </div>
        <button type="submit" disabled={enviando} className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white disabled:opacity-60">
          {enviando ? 'Cadastrando…' : 'Cadastrar médico'}
        </button>
      </form>

      {mensagem && (
        <p role={mensagem.tipo === 'erro' ? 'alert' : 'status'} className={`text-sm ${mensagem.tipo === 'erro' ? 'text-red-700' : 'text-slate-700'}`}>
          {mensagem.texto}
        </p>
      )}
    </section>
  );
}
