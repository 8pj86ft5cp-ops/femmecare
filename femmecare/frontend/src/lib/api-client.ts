export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Opcoes = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown };

/** Usado no navegador (Client Components). O Next.js encaminha /api/* para o back-end. */
export async function apiFetch<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const temCorpo = opcoes.body !== undefined;
  const res = await fetch(`/api${caminho}`, {
    method: opcoes.method ?? 'GET',
    headers: temCorpo ? { 'Content-Type': 'application/json' } : undefined,
    body: temCorpo ? JSON.stringify(opcoes.body) : undefined,
    credentials: 'same-origin',
  });

  if (!res.ok) {
    const dados = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, dados?.message ?? 'Não foi possível concluir a operação.');
  }
  // Respostas sem corpo (ex.: 201 vazio) também são aceitas.
  const texto = await res.text();
  return (texto ? JSON.parse(texto) : undefined) as T;
}
