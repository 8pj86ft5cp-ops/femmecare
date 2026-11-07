import type { Vitals } from './types';

// Fuso fixo evita diferença entre a data renderizada no servidor e no navegador.
const FUSO = 'America/Sao_Paulo';

export function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', { timeZone: FUSO, dateStyle: 'short', timeStyle: 'short' });
}

/** Data sem horário (ex.: DPP "2026-10-08"). Usa UTC para não deslocar o dia. */
export function formatarData(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

/** Linhas legíveis dos sinais vitais. Campos vazios são omitidos. */
export function formatarVitals(v: Vitals | null): string[] {
  if (!v) return [];
  const itens: string[] = [];
  if (v.systolic !== null && v.diastolic !== null) itens.push(`PA ${v.systolic}/${v.diastolic} mmHg`);
  else if (v.systolic !== null) itens.push(`PA sistólica ${v.systolic} mmHg`);
  if (v.fetalHeartRate !== null) itens.push(`BCF ${v.fetalHeartRate} bpm`);
  if (v.weightKg !== null) itens.push(`Peso ${String(v.weightKg).replace('.', ',')} kg`);
  return itens;
}
