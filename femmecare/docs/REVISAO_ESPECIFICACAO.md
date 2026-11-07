# Revisão da Especificação Técnica – FemmeCare SaaS

Este documento registra os ajustes feitos na especificação v1 antes da implementação e o motivo de cada um. Itens marcados como **Pendente** dependem de decisão do cliente.

## 1. Ajustes no modelo de dados

| Item | Especificação v1 | Implementado | Motivo |
|---|---|---|---|
| E-mail único | `UNIQUE` global | `UNIQUE (tenant_id, email)` | Em SaaS multi-tenant, a mesma pessoa pode usar clínicas diferentes. |
| Isolamento | `tenant_id` só em `users` | `tenant_id` em todas as tabelas | Permite filtrar e auditar por clínica sem depender de joins. |
| `dpp` e `gestational_week` | Armazenados | Removidos | São derivados da DUM. Armazená-los gera dados desatualizados. |
| Prescrições | Campo `prescription TEXT` em `medical_records` | Tabela `prescriptions` com `status` | Separa o registro clínico da receita e prepara a assinatura ICP-Brasil em fase posterior. |
| Severidade | `'Leve','Moderada','Intensa'` | `'LEVE','MODERADA','INTENSA'` | Padronização de enums. A exibição fica no frontend. |
| Datas | `TIMESTAMP` | `TIMESTAMPTZ` | Evita erro de fuso horário nos lembretes e alertas. |
| UUID | `uuid-ossp` | `gen_random_uuid()` | Nativo no PostgreSQL 13+, sem extensão adicional. |
| CRM | `UNIQUE` só no número | `UNIQUE (crm, crm_uf)` + campo `crm_uf` | O CRM é emitido por estado, então o número pode se repetir entre UFs. |
| Consentimento | Ausente | Tabela `consents` | Exigência prática da LGPD para dados de saúde. |
| Auditoria | Ausente | Tabela `audit_log` | Rastreia acessos e alterações em prontuário, em linha com a LGPD e as normas do CFM. |
| Constraint | Ausente | `dum` obrigatória para gestante | Evita cálculos de IG e DPP sem base. |

## 2. Pontos da especificação que ainda precisam de decisão

**Pendente – Alerta de sintomas críticos.** A especificação prevê apenas notificar o obstetra quando há sangramento, tontura forte ou cefaleia persistente. Como o médico pode não ver a notificação a tempo, a paciente deve receber, no mesmo momento, orientação de procurar atendimento de urgência (SAMU 192 ou a maternidade de referência). Sugestão: texto aprovado pela clínica, exibido em destaque.

**Pendente – Assistente IA (FemmeAI).** Um chatbot para gestantes exige:
- aviso claro de que não substitui consulta;
- recusa de orientações sobre dosagem de medicamentos e diagnóstico;
- encaminhamento automático para a equipe quando houver sintoma de alerta;
- consentimento específico registrado na tabela `consents` (finalidade `ASSISTENTE_IA`);
- definição do provedor do modelo (a especificação cita "Manus IA / Gemini" de forma ambígua).

**Pendente – Módulos ausentes.** A especificação não cobre consultas, exames e vacinas, que estavam no escopo inicial. Eles precisam de tabelas próprias (`appointments`, `exams`, `vaccines`) antes da próxima etapa.

**Pendente – Prompt da IA.** O modelo `"Xª semana"` precisa ser preenchido com a idade gestacional calculada pelo backend, não informada pelo usuário.

**Pendente – Contrato com o provedor e localização dos dados.** Definir se o banco ficará no Brasil ou em outra região, conforme já discutido.

## 3. Cálculo obstétrico

- DPP = DUM + 280 dias. Esta é a forma simplificada da regra de Naegele. Pode diferir em um ou dois dias da regra completa, conforme o mês. A DPP clínica final é definida pelo médico, geralmente com base na ultrassonografia.
- Idade gestacional = dias desde a DUM; semanas = `dias / 7`; dias restantes = `dias % 7`.
- Trimestres: 1º até 13s6d, 2º de 14 a 27s6d, 3º a partir de 28s.

## 4. Próximos passos

1. Confirmar com a clínica os pontos da seção 2.
2. Criar o projeto Spring Boot 3 (Maven) com Flyway, Spring Security e JWT.
3. Implementar `AuthController`, `PatientController`, `MedicalRecordController` e `TenantController`.
4. Implementar o filtro de tenant por domínio (resolução do `Host` na requisição).
5. Escrever testes de integração com PostgreSQL (Testcontainers) para isolamento entre clínicas.
