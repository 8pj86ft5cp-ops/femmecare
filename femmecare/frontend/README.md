# FemmeCare – Front-end

Next.js 15 (App Router) + TypeScript + Tailwind CSS. Consome o back-end Spring Boot conforme `docs/API_CONTRATO.md`.

## Rodando

```bash
cp .env.example .env.local      # ajuste API_INTERNAL_URL
npm install
npm run dev                     # http://localhost:3000
```

Para produção, defina `API_INTERNAL_URL` antes do build (`next build`), porque o proxy `/api` é configurado nesse momento.

## Whitelabel

A cor e o nome da clínica vêm de `GET /api/tenant/public`. O `layout.tsx` aplica a cor como variável CSS (`--brand`) no `<html>`. Todas as telas usam `bg-brand`, `text-brand` e `bg-brand-soft`. Trocar a identidade de uma clínica não exige nova build. Basta atualizar o tenant pelo painel.

## Estrutura

```
src/
  app/
    layout.tsx        tema e cabeçalho da clínica
    page.tsx          site institucional
    login/            autenticação
    jornada/          área da paciente (diário, contador de movimentos, FemmeAI)
    medico/           lista de pacientes, alertas e prontuário
    admin/            métricas e identidade visual
  components/         Header, botão de sair e alerta de emergência
  lib/
    api-client.ts     chamadas no navegador (/api)
    api-server.ts     chamadas no servidor (repassa cookie e host)
    session.ts        getMe e controle de papel (PATIENT, DOCTOR, ADMIN)
    tenant.ts         identidade da clínica
    types.ts          contratos de resposta
```

## Pontos de segurança já tratados

- Sessão em cookie `HttpOnly`. O token não fica acessível ao JavaScript.
- Verificação de papel em cada página no servidor. Ocultar um menu não basta.
- Alerta de emergência exibido diretamente para a paciente, sem depender da resposta da clínica.
- Datas renderizadas com fuso fixo, para evitar diferenças entre servidor e navegador.

## Textos pendentes de aprovação clínica

Antes de publicar, a equipe médica deve revisar: a orientação do contador de movimentos, o texto do alerta de emergência, o aviso da FemmeAI e as descrições dos serviços na página inicial.

## Testando sem o back-end

Há um mock em `../mock-api/server.mjs` com dados fictícios e o contrato da API já implementado. Não usa Java nem banco.

```bash
cd ../mock-api && node server.mjs      # sobe em http://localhost:8080
cd ../frontend && npm run dev          # sobe em http://localhost:3000
```

Contas de teste (senha `123456` para todas):

| Papel | E-mail |
|---|---|
| Paciente | paciente@demo.com |
| Médica | medica@demo.com |
| Admin da clínica | admin@demo.com |
