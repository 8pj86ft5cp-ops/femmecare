# Contrato da API – FemmeCare (front-end ↔ back-end)

Base: todas as rotas ficam sob `/api`. O navegador chama `/api/*` no próprio domínio da clínica, e o Next.js encaminha para o Spring Boot (`API_INTERNAL_URL`). Não há CORS.

## Regras gerais

- **Sessão:** cookie `HttpOnly`, `Secure` e `SameSite=Strict`, emitido em `POST /auth/login`. Nada de token em `localStorage`, para proteger dados de saúde.
- **Tenant:** a clínica é identificada pelo host. O servidor do Next.js envia o cabeçalho `X-Forwarded-Host`. O back-end deve usar esse valor quando vier do proxy. Confirmar o comportamento no deploy.
- **Erros:** JSON com `{ "message": "..." }` e status HTTP adequado (`400`, `401`, `403`, `404`, `409`, `422`, `500`).
- **Datas:** `date` em `YYYY-MM-DD`; `datetime` em ISO 8601 com fuso (`Z` ou offset).
- **Auditoria:** toda leitura ou escrita em prontuário, sintoma ou exame gera registro em `audit_log`.

## Autenticação

| Método | Rota | Papel | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/auth/login` | público | `{ email, password }` | `Me` + cookie. `401` se inválido |
| POST | `/auth/first-access/validate` | público | `{ token }` | `{ name, email }`. `410` se o convite expirou ou já foi usado |
| POST | `/auth/first-access` | público | `{ token, password, consentAccepted: true, consentVersion }` | `204`. Define a senha, registra o consentimento e invalida o convite |
| POST | `/auth/logout` | logado | – | `204` (remove o cookie) |
| GET | `/auth/me` | logado | – | `Me`, com `consentRequired` para pacientes. `401` se não houver sessão |
| POST | `/patients/me/consent` | PATIENT sem aceite | `{ accepted: true, version }` | `201`. Registra `TERMOS_USO` em `consents` |

**Convite de primeiro acesso:** a médica cria a paciente com `POST /doctors/patients`. A resposta inclui `invitationToken` aleatório, exibido como link pelo front-end em um fragmento (`#token`), e `expiresAt` (48 horas). O front-end remove o token da barra de endereço após carregá-lo. O token deve ser armazenado somente como hash, ter uso único e expirar; não enviar o token por logs. A senha deve ser armazenada com algoritmo de hash apropriado (Argon2id ou BCrypt), nunca em texto puro. Para contas convidadas, `password_setup_required` indica que ainda não há senha; o convite só pode definir uma senha uma vez. O mock guarda convites em memória apenas para testes locais.

## Tenant (identidade visual)

| Método | Rota | Papel | Resposta |
|---|---|---|---|
| GET | `/tenant/public` | público | `Tenant` |
| PUT | `/admin/tenant` | ADMIN | `Tenant` (corpo: `{ name, logoUrl, primaryColor }`) |

`primaryColor` aceita apenas `#RRGGBB` ou `#RRGGBBAA`. Valores fora desse formato devem retornar `422`.

## Paciente (`PATIENT`)

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/patients/me/journey` | – | `Journey` |
| GET | `/patients/me/notifications` | – | `{ documents, appointment }` com novidades ainda não lidas |
| POST | `/patients/me/notifications/read` | `{ section: documents\|appointment }` | `204`. Marca a seção como lida |
| GET / PUT | `/patients/me/birth-plan-checklist` | PUT: `{ itemId, checked }` | Itens do checklist e estado atualizado |
| GET | `/patients/me/data-export` | – | JSON com dados cadastrais, clínicos e documentos |
| POST | `/patients/me/deletion-request` | `{}` | `201` com solicitação `PENDING`; exclusão não é executada automaticamente |
| GET | `/patients/me/symptoms` | – | `SymptomLog[]` (mais recentes primeiro) |
| POST | `/patients/me/symptoms` | `{ symptom, severity }` | `SymptomLog` com `isAlert` |
| POST | `/patients/me/kick-sessions` | `{ startedAt, durationSeconds, kicks }` | `201` |
| POST | `/ai/ask` | `{ message }` (máx. 500 caracteres) | `AiAnswer` |

**Regras de negócio que o back-end deve aplicar:**

- `isAlert = true` quando o sintoma for sangramento, tontura forte ou cefaleia persistente. Nesse caso, notificar o obstetra responsável.
- `Journey` é calculado pelo back-end a partir da DUM (regra de Naegele: DPP = DUM + 280 dias). `weeks`, `days`, `trimester` e `progressPercent` (IG em dias / 280 × 100) não são armazenados.
- `ai/ask` deve incluir a idade gestacional no prompt, sem depender do que o usuário informar. Também deve encaminhar à equipe quando houver sinal de alerta, e nesse caso retornar `escalated: true`.
- `kick-sessions` só pode ser usado por gestantes a partir do 2º trimestre. O front-end já esconde o contador, mas o back-end deve validar.

## Médico (`DOCTOR`)

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| POST | `/doctors/patients` | `{ name, email, birthDate, phone?, stage, dum?, riskLevel? }` | `201` com `{ patient: PatientSummary, invitationToken, expiresAt }`. `409` se e-mail já existir |
| GET | `/doctors/alerts` | – | `AlertItem[]` (alertas não lidos) |
| POST | `/doctors/alerts/{id}/read` | `{}` | `204`. Marca o alerta como lido pelo médico atual |
| GET | `/doctors/patients?risk=HIGH` | – | `PatientSummary[]` (`risk` é opcional) |
| GET | `/doctors/appointments?date=YYYY-MM-DD` | – | Consultas do tenant na data, ordenadas por horário |
| GET | `/doctors/patients/{id}` | – | `PatientSummary`. `404` se a paciente for de outra clínica |
| GET | `/doctors/patients/{id}/records` | – | `MedicalRecord[]` |
| GET | `/doctors/patients/{id}/birth-plan-checklist` | – | Itens do checklist e estado marcado pela paciente |
| POST | `/doctors/patients/{id}/records` | `{ title, notes }` | `201` com `MedicalRecord` |

Toda consulta filtra pelo `tenant_id` do usuário logado. Uma paciente de outra clínica deve retornar `404`, e não `403`, para não revelar que ela existe.

## Administrador (`ADMIN`)

| Método | Rota | Resposta |
|---|---|---|
| GET | `/admin/metrics` | `Metrics` |
| GET | `/admin/audit-log` | Últimos 200 acessos e ações de prontuário do tenant |
| GET | `/admin/deletion-requests` | Pedidos de exclusão pendentes do tenant |

## Tipos

```ts
Me          { id, name, email, role: 'PATIENT' | 'DOCTOR' | 'ADMIN', consentRequired? }
Tenant      { name, logoUrl: string|null, primaryColor: string|null }
Journey     { stage: 'PRE_CONCEPTION'|'PRENATAL'|'POSTPARTUM', weeks, days, trimester, dpp: date|null, progressPercent }
SymptomLog  { id, symptom, severity: 'LEVE'|'MODERADA'|'INTENSA', isAlert, loggedAt }
AiAnswer    { answer, escalated }
PatientSummary { id, name, stage, weeks: number|null, riskLevel: 'LOW'|'HIGH' }
AlertItem   { id, patientId, patientName, symptom, severity, loggedAt, isRead }
MedicalRecord  { id, title, notes, doctorName, createdAt }
Metrics     { activePatients, doctors, monthlyUsageRate, retentionRate }
```

## Pendências do back-end em relação à especificação v1

- Rotas `/patients/me/kick-sessions`, `/admin/metrics`, `/admin/tenant` e `/doctors/patients/{id}` não estavam na especificação.
- Campos `weeks`, `days`, `trimester` e `progressPercent` são retornados prontos, para que o front-end não repita a lógica obstétrica.

## Adições desta versão

| Método | Rota | Papel | Corpo | Resposta |
|---|---|---|---|---|
| POST | `/patients/me/calculator` | PATIENT | `{ dum }` (`YYYY-MM-DD`) | `CalcResult` ou `422` se a DUM for futura |
| GET | `/doctors/patients/{id}/prescriptions` | DOCTOR | – | `Prescription[]` |
| POST | `/doctors/patients/{id}/prescriptions` | DOCTOR | `{ content }` | `201` com status `DRAFT` |
| GET | `/admin/doctors` | ADMIN | – | `Doctor[]` |
| POST | `/admin/doctors` | ADMIN | `{ name, email, crm, crmUf, specialty }` | `201`, `409` se o e-mail já existir |
| PATCH | `/admin/doctors/{id}` | ADMIN | `{ active }` | `Doctor` |

**Mudanças em rotas existentes**

- `POST /doctors/patients/{id}/records` aceita `vitals: { systolic, diastolic, fetalHeartRate, weightKg }`. Campos vazios são `null`. Valores fora da faixa retornam `422`. Faixas: PA sistólica 60–260, diastólica 30–160, BCF 80–220, peso 30–250 kg.
- `MedicalRecord` passa a incluir `vitals`.
- `Tenant` passa a incluir `domain`. O `PUT /admin/tenant` **ignora** esse campo, porque o domínio é configurado na infraestrutura.
- Médicos com `active: false` não conseguem fazer login (`403`).
- O cadastro de pacientes exige nome, e-mail, data de nascimento e etapa válida; a DUM é obrigatória para `PRENATAL`. E-mails são únicos por clínica.
- Convites de primeiro acesso devem usar token aleatório de uso único, armazenado somente como hash e com expiração de 48 horas. O aceite do termo é obrigatório antes de criar a senha e deve ser persistido em `consents`.
- `GET /auth/me` sinaliza `consentRequired`; rotas de paciente devem impedir uso enquanto não houver termo vigente. O aceite e a versão precisam ser registrados de modo auditável.
- A exportação de dados deve incluir os dados pessoais e documentos pertencentes à própria paciente. A solicitação de exclusão abre um pedido para análise humana, sem apagar automaticamente prontuários sujeitos a retenção legal.
- A lista de auditoria é restrita ao ADMIN do mesmo tenant; não deve expor endereços de IP nem dados clínicos além da identificação necessária para prestação de contas.
- A UI do checklist não substitui aconselhamento médico. O texto provisório de consentimento não está aprovado para produção.

**Regras que o back-end deve manter**

- Prescrições são salvas apenas como `DRAFT`. Nenhuma rota deve emitir ou assinar receita sem a validação do ICP-Brasil e a revisão jurídica.
- A calculadora não grava nada. O cálculo deve ser o mesmo do `GestationalCalculator` (DPP = DUM + 280 dias).
- A triagem é ordenada pelo front-end. O back-end pode oferecer essa ordenação, se preferir.

## Versão das abas da paciente

**Removida:** `POST /patients/me/calculator`. A calculadora agora é registrada pela médica.

**Paciente (`PATIENT`)**

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/patients/me/appointment` | – | `Appointment` ou `null` |
| GET | `/patients/me/documents?type=LAB_RESULT\|ULTRASOUND` | – | `Documento[]` (sem conteúdo) |
| GET | `/patients/me/exam-requests` | – | `ExamRequest[]` |
| POST | `/patients/me/exam-requests/{id}/documents` | `{ name, mimeType, contentBase64 }` | `201` com `Documento`. Muda a solicitação para `UPLOADED` |
| GET | `/patients/me/glucose` | – | `GlucoseReading[]` |
| POST | `/patients/me/glucose` | `{ value, context }` | `201`. `value` entre 20 e 600 mg/dL. `context`: `JEJUM`, `POS_REFEICAO` ou `ALEATORIA` |
| GET | `/patients/me/blood-pressure` | – | `BloodPressureReading[]` |
| POST | `/patients/me/blood-pressure` | `{ systolic, diastolic }` | `201` com `BloodPressureResult` |
| GET | `/patients/me/prescriptions` | – | Somente receitas que **não** estão em `DRAFT` |
| POST | `/patients/me/consent` | `{ accepted: true, version }` | `201`. Aceite obrigatório em contas sem termo vigente |
| GET | `/patients/me/notifications` | – | Contagem de documentos e consultas ainda não vistos |
| POST | `/patients/me/notifications/read` | `{ section: documents\|appointment }` | `204` |
| GET / PUT | `/patients/me/birth-plan-checklist` | PUT: `{ itemId, checked }` | Checklist da paciente |
| GET | `/patients/me/data-export` | – | Exportação JSON, incluindo documentos próprios |
| POST | `/patients/me/deletion-request` | `{}` | Pedido de exclusão para revisão da clínica |

**Médica (`DOCTOR`)**

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| PUT | `/doctors/patients/{id}/gestation` | `{ dum }` | `200` com DPP, IG e trimestre. A paciente vê no caderno |
| GET / POST | `/doctors/patients/{id}/exam-requests` | `{ name, notes? }` | `ExamRequest[]` / `201` |
| GET / POST | `/doctors/patients/{id}/documents` | `{ type: ULTRASOUND\|LAB_RESULT, name, mimeType, contentBase64 }` | `Documento[]` / `201` |
| GET / PUT | `/doctors/patients/{id}/appointment` | `{ scheduledAt, notes? }` | `Appointment` ou `null` / `200` |
| GET / POST | `/doctors/patients/{id}/blood-pressure` | `{ systolic, diastolic }` | Lista / `201`. Medição da equipe **não** gera aviso |
| GET | `/doctors/patients/{id}/birth-plan-checklist` | – | Checklist marcado pela paciente |
| GET | `/doctors/appointments?date=YYYY-MM-DD` | – | Agenda de todas as pacientes da clínica no dia |
| POST | `/doctors/alerts/{id}/read` | `{}` | `204` |

**Administrador (`ADMIN`)**

| Método | Rota | Resposta |
|---|---|---|
| GET | `/admin/audit-log` | Últimos 200 acessos e ações do tenant, sem IP |
| GET | `/admin/deletion-requests` | Solicitações de exclusão aguardando análise |

**Responsabilidades de produção:** a migration `V2__convites_notificacoes_checklist.sql` prepara armazenamento para convites, leituras de alertas, estado de notificações, checklist e pedidos de exclusão. O backend Spring Boot não está incluído neste repositório; as rotas desta seção estão implementadas apenas no mock local e precisam de implementação, autorização por tenant e testes antes do deploy.

**Ambos os papéis**

| Método | Rota | Regra |
|---|---|---|
| GET | `/exam-requests/{id}` | Médica do tenant ou a paciente dona da solicitação. Usado pelo PDF |
| GET | `/documents/{id}/download` | Paciente dona do documento ou médica do tenant. Retorna o arquivo com `Content-Disposition` |

**Regras de negócio**

- **Pressão em faixa de risco:** sistólica ≥ 160 mmHg **ou** diastólica ≥ 110 mmHg. Esse limiar deve ser validado pelo obstetra antes de produção.
- Quando a **paciente** registra pressão em faixa de risco, o back-end cria um alerta na lista da médica (`notifiedDoctor: true`).
- **Notificação externa (SMS, push, WhatsApp):** o código deve existir atrás de uma flag, desligada por padrão (`externalNotification: false`). Ligar essa flag depende da escolha da API de envio.
- Arquivos: PDF, JPG ou PNG, até 10 MB. No mock o conteúdo vai em base64 dentro do JSON. Em produção, use upload `multipart/form-data` e armazenamento de arquivos (ex.: S3 ou equivalente), com links de download autenticados.
- Receitas em `DRAFT` nunca aparecem para a paciente.
- O PDF das solicitações é gerado pelo front-end (Next.js) com os dados retornados por `/exam-requests/{id}`.
- O cadastro e o primeiro acesso foram conectados ao mock local para demonstração; a API Spring Boot deste repositório ainda precisa implementar as rotas acima antes de disponibilizar convites em produção. O mock mantém seus dados somente em memória e não deve receber dados reais.
