import type { Role } from './types';

// Módulo sem dependências de servidor, para poder ser importado por componentes de cliente.
export const HOME_POR_PAPEL: Record<Role, string> = {
  PATIENT: '/jornada',
  DOCTOR: '/medico',
  ADMIN: '/admin',
};
