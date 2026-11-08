import { redirect } from 'next/navigation';
import { serverApi } from './api-server';
import { HOME_POR_PAPEL } from './papeis';
import type { Me, Role } from './types';

export { HOME_POR_PAPEL };

/** Usuário logado ou null. Erros de rede também viram null, para não derrubar a página. */
export async function getMe(): Promise<Me | null> {
  try {
    return await serverApi<Me>('/auth/me');
  } catch {
    return null;
  }
}

/** Garante o papel exigido pela página. Caso contrário, redireciona. */
export async function requirePapel(papel: Role): Promise<Me> {
  const me = await getMe();
  if (!me) redirect('/login');
  if (me.role === 'PATIENT' && me.consentRequired) redirect('/consentimento');
  if (me.role !== papel) redirect(HOME_POR_PAPEL[me.role]);
  return me;
}
