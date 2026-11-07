// Exibido quando um sintoma de alerta é registrado. Não depende de resposta da clínica.
export function EmergenciaAlerta({ mensagem }: { mensagem?: string }) {
  return (
    <div role="alert" className="rounded-xl border-2 border-red-600 bg-red-50 p-4 text-red-900">
      <p className="font-bold">Procure atendimento de urgência agora</p>
      <p className="mt-1 text-sm">
        {mensagem ?? 'Os sintomas que você descreveu podem exigir avaliação imediata.'}
      </p>
      <p className="mt-2 text-sm">
        Ligue <strong>192 (SAMU)</strong> ou vá à maternidade de referência. Não espere a resposta da clínica.
      </p>
    </div>
  );
}
