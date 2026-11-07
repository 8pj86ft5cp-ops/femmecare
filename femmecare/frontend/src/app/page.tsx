import Link from 'next/link';
import { getTenant } from '@/lib/tenant';

const SERVICOS = [
  {
    titulo: 'Pré-concepção',
    texto: 'Preparação antes da gravidez, com exames e orientações sobre suplementação.',
  },
  {
    titulo: 'Pré-natal',
    texto: 'Acompanhamento semana a semana, com consultas, exames e orientação em caso de sintomas de alerta.',
  },
  {
    titulo: 'Pós-parto',
    texto: 'Cuidados no puerpério, com orientações para a mãe e para o bebê.',
  },
];

export default async function HomePage() {
  const tenant = await getTenant();

  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-brand-soft p-8 md:p-12">
        <h1 className="text-3xl font-bold md:text-4xl">Sua jornada com a {tenant.name}</h1>
        <p className="mt-3 max-w-2xl text-slate-700">
          Da preparação para a gravidez ao pós-parto, acompanhe sua gestação em um só lugar.
        </p>
        <Link href="/login" className="mt-6 inline-block rounded-lg bg-brand px-5 py-3 font-medium text-white">
          Acessar minha área
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {SERVICOS.map((s) => (
          <article key={s.titulo} className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{s.titulo}</h2>
            <p className="mt-2 text-sm text-slate-600">{s.texto}</p>
          </article>
        ))}
      </section>

      <p className="text-xs text-slate-500">
        As informações deste site não substituem a consulta com o seu médico. Em caso de emergência, ligue 192 (SAMU).
      </p>
    </div>
  );
}
