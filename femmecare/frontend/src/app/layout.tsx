import type { Metadata } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import './globals.css';
import { Header } from '@/components/Header';
import { getMe } from '@/lib/session';
import { getTenant } from '@/lib/tenant';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();
  return {
    title: tenant.name,
    description: 'Acompanhamento da gestação e da preparação para a gravidez',
    other: { 'color-scheme': 'light' },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [tenant, me] = await Promise.all([getTenant(), getMe()]);
  const cor = tenant.primaryColor ?? '#0f766e';

  // A identidade visual da clínica entra como variáveis CSS na raiz do documento.
  const tema = {
    '--brand': cor,
    '--brand-soft': `color-mix(in srgb, ${cor} 12%, white)`,
  } as CSSProperties;

  return (
    // suppressHydrationWarning: extensões como o Dark Reader alteram atributos desta tag antes do React carregar.
    <html lang="pt-BR" style={tema} suppressHydrationWarning>
      <body className="min-h-screen bg-white">
        <Header tenant={tenant} me={me} />
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
