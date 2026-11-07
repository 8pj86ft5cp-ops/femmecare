import Link from 'next/link';
import type { Me, Role, Tenant } from '@/lib/types';
import { LogoutButton } from './LogoutButton';

const MENU: Record<Role, { href: string; label: string }[]> = {
  PATIENT: [{ href: '/jornada', label: 'Minha área' }],
  DOCTOR: [{ href: '/medico', label: 'Pacientes' }],
  ADMIN: [{ href: '/admin', label: 'Painel da clínica' }],
};

export function Header({ tenant, me }: { tenant: Tenant; me: Me | null }) {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-9 w-auto" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand font-bold text-white">
              {tenant.name.charAt(0)}
            </span>
          )}
          <span className="font-semibold">{tenant.name}</span>
        </Link>

        {me ? (
          <nav className="flex items-center gap-4 text-sm">
            {MENU[me.role].map((item) => (
              <Link key={item.href} href={item.href} className="text-slate-600 hover:text-brand">
                {item.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        ) : (
          <Link href="/login" className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
