export const LIMITE_ARQUIVO_BYTES = 10 * 1024 * 1024;
export const TIPOS_PACIENTE = 'application/pdf,image/jpeg,image/png';

/** Lê um arquivo e devolve só o conteúdo em base64 (sem o prefixo data:). */
export function lerArquivoBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const texto = String(leitor.result);
      resolve(texto.slice(texto.indexOf(',') + 1));
    };
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsDataURL(arquivo);
  });
}
