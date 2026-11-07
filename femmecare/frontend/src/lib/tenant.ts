import { serverApi } from './api-server';
import type { Tenant } from './types';

export const TENANT_PADRAO: Tenant = {
  name: 'Clínica',
  logoUrl: null,
  primaryColor: '#0f766e',
  domain: '',
};

/** Identidade da clínica identificada pelo domínio. Se o back-end falhar, usa o padrão. */
export async function getTenant(): Promise<Tenant> {
  try {
    return await serverApi<Tenant>('/tenant/public');
  } catch {
    return TENANT_PADRAO;
  }
}
