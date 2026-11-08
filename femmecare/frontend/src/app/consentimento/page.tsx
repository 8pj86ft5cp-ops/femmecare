import { redirect } from 'next/navigation';
import { getMe, HOME_POR_PAPEL } from '@/lib/session';
import { ConsentimentoForm } from './ConsentimentoForm';

export default async function ConsentimentoPage() {
  const me = await getMe();
  if (!me) redirect('/login');
  if (me.role !== 'PATIENT') redirect(HOME_POR_PAPEL[me.role]);
  if (!me.consentRequired) redirect('/jornada');

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800">Termo de consentimento</h1>
      <ConsentimentoForm />
    </div>
  );
}
