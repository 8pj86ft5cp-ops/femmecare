'use client';

import { useState } from 'react';
import { ApiError, apiFetch } from '@/lib/api-client';

export function MeusDados() {
  const [erro, setErro] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function baixarDados() {
    setCarregando(true);
    setErro(null);
    setStatus(null);
    try {
      const dados = await apiFetch<Record<string, unknown>>('/patients/me/data-export');
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'meus-dados-femmecare.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus('Seu arquivo foi preparado para download.');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível preparar a exportação.');
    } finally {
      setCarregando(false);
    }
  }

  async function solicitarExclusao() {
    const confirmado = window.confirm(
      'Deseja enviar à clínica uma solicitação de exclusão dos seus dados? O pedido será analisado pela equipe. Prontuários podem estar sujeitos a prazos legais de guarda.',
    );
    if (!confirmado) return;
    setCarregando(true);
    setErro(null);
    setStatus(null);
    try {
      await apiFetch<{ message: string }>('/patients/me/deletion-request', { method: 'POST', body: {} });
      setStatus('Solicitação registrada. A clínica analisará o pedido e entrará em contato.');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível enviar a solicitação.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h2 className="font-semibold text-slate-800">Baixar meus dados</h2>
        <p className="text-sm text-slate-600">
          Gere um arquivo JSON com seus dados de cadastro, registros e documentos disponíveis.
        </p>
        <button type="button" disabled={carregando} onClick={() => void baixarDados()} className="rounded-lg bg-[#dcebdc] px-4 py-2 text-sm font-medium text-[#456b49] disabled:opacity-60">
          Baixar arquivo dos meus dados
        </button>
      </section>
      <section className="space-y-2 border-t border-slate-100 pt-4">
        <h2 className="font-semibold text-slate-800">Solicitar exclusão</h2>
        <p className="text-sm text-slate-600">
          O pedido será analisado pela clínica. Alguns registros de saúde podem ter obrigação legal de guarda.
        </p>
        <button type="button" disabled={carregando} onClick={() => void solicitarExclusao()} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-60">
          Solicitar exclusão dos meus dados
        </button>
      </section>
      {carregando && <p role="status" className="text-sm text-slate-500">Processando…</p>}
      {status && <p role="status" className="text-sm text-[#456b49]">{status}</p>}
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
    </div>
  );
}
