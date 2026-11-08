import { PrimeiroAcessoForm } from './PrimeiroAcessoForm';

export default function PrimeiroAcessoPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-8">
      <h1 className="text-center text-2xl font-bold text-slate-800">Primeiro acesso</h1>
      <PrimeiroAcessoForm />
    </div>
  );
}
