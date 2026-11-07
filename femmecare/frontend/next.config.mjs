/** @type {import('next').NextConfig} */
// O navegador chama /api/* no mesmo domínio do site. O Next.js encaminha para o back-end.
// Assim o cookie de sessão (HttpOnly) funciona sem configuração de CORS.
// Observação: a variável é lida no build. Defina API_INTERNAL_URL antes de rodar `next build`.
const API_INTERNAL_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:8080';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_INTERNAL_URL}/api/:path*` }];
  },
};

export default nextConfig;
