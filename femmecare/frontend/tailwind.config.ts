import type { Config } from 'tailwindcss';

// As cores da marca vêm de variáveis CSS definidas no <html> a partir do tenant.
// Assim a mesma build atende todas as clínicas (whitelabel).
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand)',
        'brand-soft': 'var(--brand-soft)',
      },
    },
  },
  plugins: [],
};

export default config;
