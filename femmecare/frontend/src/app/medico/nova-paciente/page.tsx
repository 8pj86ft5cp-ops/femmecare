import { requirePapel } from '@/lib/session';
import { PacienteForm } from './PacienteForm';

export default async function NovaPacientePage() {
  await requirePapel('DOCTOR');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cadastrar paciente</h1>
        <p className="mt-1 text-sm text-slate-600">
          Preencha os dados e gere um convite para a paciente criar a senha de acesso.
        </p>
      </div>
      <PacienteForm />
    </div>
  );
}
