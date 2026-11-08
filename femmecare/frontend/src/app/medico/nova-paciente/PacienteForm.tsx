'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { Stage } from '@/lib/types';

const CAMPO =
  'w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

interface ConvitePaciente {
  patient: { id: string; name: string };
  invitationToken: string;
  expiresAt: string;
}

export function PacienteForm() {
  const [etapa, setEtapa] = useState<Stage>('PRENATAL');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [convite, setConvite] = useState<{ nome: string; link: string; expiresAt: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [erroCopia, setErroCopia] = useState(false);

  async function cadastrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    setConvite(null);
    const form = new FormData(e.currentTarget);

    try {
      const resultado = await apiFetch<ConvitePaciente>('/doctors/patients', {
        method: 'POST',
        body: {
          name: form.get('name'),
          email: form.get('email'),
          birthDate: form.get('birthDate'),
          phone: form.get('phone') || null,
          stage: etapa,
          dum: form.get('dum') || null,
          riskLevel: form.get('riskLevel'),
        },
      });
      const link = new URL(
        '/primeiro-acesso',
        window.location.origin,
      ).toString();
      setConvite({
        nome: resultado.patient.name,
        link: `${link}#${resultado.invitationToken}`,
        expiresAt: resultado.expiresAt,
      });
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível cadastrar a paciente.');
    } finally {
      setEnviando(false);
    }
  }

  async function copiarLink() {
    if (!convite) return;
    setCopiado(false);
    setErroCopia(false);
    try {
      await navigator.clipboard.writeText(convite.link);
      setCopiado(true);
    } catch {
      setErroCopia(true);
    }
  }

  if (convite) {
    return (
      <section className="space-y-4 rounded-2xl border border-[#dcebdc] bg-[#fffdfb] p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Paciente cadastrada</h2>
          <p className="mt-1 text-sm text-slate-600">
            Envie este link para {convite.nome} definir a própria senha. O link expira em 48 horas e só pode ser
            utilizado uma vez.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Válido até {new Date(convite.expiresAt).toLocaleString('pt-BR')}.
          </p>
        </div>
        <label htmlFor="link-convite" className="block text-sm font-medium text-slate-700">
          Link de primeiro acesso
        </label>
        <input id="link-convite" readOnly value={convite.link} className={CAMPO} onFocus={(e) => e.target.select()} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={copiarLink} className="rounded-lg bg-[#dcebdc] px-4 py-2 text-sm font-medium text-[#456b49] hover:bg-[#e1eee1]">
            Copiar link
          </button>
          <Link href="/medico" className="text-sm font-medium text-brand hover:underline">
            Voltar à lista de pacientes
          </Link>
        </div>
        {copiado && <p role="status" className="text-sm text-[#456b49]">Link copiado.</p>}
        {erroCopia && <p role="alert" className="text-sm text-red-700">Não foi possível copiar. Selecione e copie o link acima.</p>}
      </section>
    );
  }

  return (
    <form onSubmit={cadastrar} className="space-y-5 rounded-2xl border border-[#f0e5e0] bg-[#fffdfb] p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Nome completo</label>
          <input id="name" name="name" required maxLength={150} autoComplete="name" className={CAMPO} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">E-mail</label>
          <input id="email" name="email" type="email" required maxLength={150} autoComplete="email" className={CAMPO} />
        </div>
        <div>
          <label htmlFor="birthDate" className="mb-1 block text-sm font-medium">Data de nascimento</label>
          <input id="birthDate" name="birthDate" type="date" required autoComplete="bday" className={CAMPO} />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">Telefone (opcional)</label>
          <input id="phone" name="phone" type="tel" maxLength={20} autoComplete="tel" className={CAMPO} />
        </div>
        <div>
          <label htmlFor="stage" className="mb-1 block text-sm font-medium">Etapa</label>
          <select
            id="stage"
            name="stage"
            required
            value={etapa}
            onChange={(e) => setEtapa(e.target.value as Stage)}
            className={CAMPO}
          >
            <option value="PRE_CONCEPTION">Pré-concepção</option>
            <option value="PRENATAL">Pré-natal</option>
            <option value="POSTPARTUM">Pós-parto</option>
          </select>
        </div>
        <div>
          <label htmlFor="dum" className="mb-1 block text-sm font-medium">Data da última menstruação (DUM)</label>
          <input id="dum" name="dum" type="date" required={etapa === 'PRENATAL'} disabled={etapa !== 'PRENATAL'} className={CAMPO} />
          <p className="mt-1 text-xs text-slate-500">
            {etapa === 'PRENATAL' ? 'Obrigatória para pacientes em pré-natal.' : 'Usada somente no pré-natal.'}
          </p>
        </div>
        <div>
          <label htmlFor="riskLevel" className="mb-1 block text-sm font-medium">Classificação de risco</label>
          <select id="riskLevel" name="riskLevel" defaultValue="LOW" className={CAMPO}>
            <option value="LOW">Habitual</option>
            <option value="HIGH">Alto risco</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Após o cadastro, você receberá um link de primeiro acesso para compartilhar com a paciente. O link expira em 48 horas.
      </p>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={enviando} className="rounded-lg bg-brand px-5 py-2.5 font-medium text-white disabled:opacity-60">
          {enviando ? 'Cadastrando…' : 'Cadastrar e gerar convite'}
        </button>
        <Link href="/medico" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
