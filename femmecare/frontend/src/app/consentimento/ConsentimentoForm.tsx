'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ApiError, apiFetch } from '@/lib/api-client';

const VERSAO = '1.0-provisorio';

export function ConsentimentoForm() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aceitar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await apiFetch<void>('/patients/me/consent', {
        method: 'POST',
        body: { accepted: true, version: VERSAO },
      });
      router.replace('/jornada');
      router.refresh();
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível registrar seu aceite.');
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={aceitar} className="space-y-5 rounded-2xl border border-[#dcebdc] bg-[#fffdfb] p-6 shadow-sm">
      <div className="space-y-3 text-sm leading-6 text-slate-700">
        <p>
          Este é um termo provisório para demonstração e deve ser revisado e aprovado pela assessoria jurídica
          e pela equipe clínica antes de qualquer uso real.
        </p>
        <h2 className="font-semibold text-slate-800">Uso e tratamento de dados</h2>
        <p>
          Seus dados pessoais e informações de saúde serão utilizados para organizar seu acompanhamento,
          registrar informações fornecidas por você e compartilhar dados necessários com a equipe de saúde
          responsável pelo seu atendimento.
        </p>
        <p>
          O acesso é limitado conforme o papel de cada profissional. Você pode solicitar informações ou a
          exclusão dos dados à clínica, observadas as obrigações legais de guarda de prontuário e as demais
          hipóteses previstas na legislação.
        </p>
        <p className="rounded-lg bg-[#edf5ed] p-3 text-xs">
          Versão {VERSAO}. Este texto não substitui o termo de consentimento definitivo aprovado pelo jurídico.
        </p>
      </div>
      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input type="checkbox" required className="mt-1 h-4 w-4 accent-[#58765b]" />
        <span>Li e aceito este termo provisório e o tratamento dos meus dados para o acompanhamento descrito.</span>
      </label>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <button type="submit" disabled={enviando} className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-60">
        {enviando ? 'Registrando aceite…' : 'Aceitar e continuar'}
      </button>
    </form>
  );
}
