import { redirect } from 'next/navigation';
import { getMe, HOME_POR_PAPEL } from '@/lib/session';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const me = await getMe();
  if (me) redirect(HOME_POR_PAPEL[me.role]);

  return (
    <div className="py-8">
      <h1 className="mb-6 text-center text-2xl font-bold">Entrar na sua área</h1>
      <LoginForm />
    </div>
  );
}
