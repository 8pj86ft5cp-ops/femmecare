import { cookies, headers } from 'next/headers';
import { ApiError } from './api-client';

const BACKEND = process.env.API_INTERNAL_URL ?? 'http://localhost:8080';

/**
 * Usado apenas no servidor (Server Components).
 * Repassa o cookie de sessão e o host original, para o back-end identificar a clínica (tenant).
 */
export async function serverApi<T>(caminho: string): Promise<T> {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);

  const res = await fetch(`${BACKEND}/api${caminho}`, {
    cache: 'no-store',
    headers: {
      Cookie: cookieStore.toString(),
      'X-Forwarded-Host': headerStore.get('host') ?? '',
    },
  });

  if (!res.ok) {
    const dados = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new ApiError(res.status, dados?.message ?? 'Erro ao carregar dados.');
  }
  return (await res.json()) as T;
}
