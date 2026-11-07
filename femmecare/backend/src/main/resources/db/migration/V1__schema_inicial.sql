-- =============================================================================
-- FemmeCare SaaS - Migração V1 (schema inicial)
-- Revisão da especificação técnica v1. Principais mudanças:
--   * tenant_id em todas as tabelas de negócio (isolamento entre clínicas)
--   * e-mail único por clínica, não global
--   * campos derivados (dpp, gestational_week) removidos: são calculados
--   * prescrições em tabela própria, com status, preparadas para ICP-Brasil
--   * tabelas de consentimento (LGPD) e de auditoria (dados de saúde)
--   * timestamptz em vez de timestamp; gen_random_uuid() (nativo no PG 13+)
-- =============================================================================

-- 1. Clínicas (tenants) ------------------------------------------------------
CREATE TABLE tenants (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(150) NOT NULL,
    domain        VARCHAR(255) NOT NULL UNIQUE,      -- ex.: atendimento.clinica.com.br
    logo_url      VARCHAR(500),
    primary_color VARCHAR(9),                        -- ex.: #0F766E
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tenant_color CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$')
);

-- 2. Usuários (autenticação) -------------------------------------------------
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name          VARCHAR(150) NOT NULL,
    email         VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,             -- BCrypt/Argon2, nunca texto puro
    role          VARCHAR(30)  NOT NULL CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- 3. Pacientes ---------------------------------------------------------------
CREATE TABLE patients (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    birth_date   DATE        NOT NULL,
    phone        VARCHAR(20),
    blood_type   VARCHAR(5),
    stage        VARCHAR(30) NOT NULL CHECK (stage IN ('PRE_CONCEPTION', 'PRENATAL', 'POSTPARTUM')),
    dum          DATE,                               -- Data da Última Menstruação (base do cálculo)
    risk_level   VARCHAR(20) NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'HIGH')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Gestante precisa de DUM para o cálculo de IG e DPP
    CONSTRAINT chk_patient_dum_prenatal CHECK (stage <> 'PRENATAL' OR dum IS NOT NULL)
);
CREATE INDEX idx_patients_tenant_risk ON patients(tenant_id, risk_level);

-- 4. Médicos -----------------------------------------------------------------
CREATE TABLE doctors (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    crm       VARCHAR(20) NOT NULL,
    crm_uf    CHAR(2)     NOT NULL,                  -- CRM é por estado
    specialty VARCHAR(100) NOT NULL,
    CONSTRAINT uq_doctors_crm UNIQUE (crm, crm_uf)
);

-- 5. Consentimentos (LGPD) ---------------------------------------------------
-- Registra o aceite de termos e finalidades, com possibilidade de revogação.
CREATE TABLE consents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id  UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    purpose     VARCHAR(60) NOT NULL,                -- ex.: TERMOS_USO, DADOS_SAUDE, ASSISTENTE_IA
    version     VARCHAR(20) NOT NULL,                -- versão do texto aceito
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at  TIMESTAMPTZ
);
CREATE INDEX idx_consents_patient ON consents(patient_id, purpose);

-- 6. Diário de sintomas (registrado pela paciente) --------------------------
CREATE TABLE symptom_logs (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    symptom    TEXT        NOT NULL,
    severity   VARCHAR(20) NOT NULL CHECK (severity IN ('LEVE', 'MODERADA', 'INTENSA')),
    is_alert   BOOLEAN     NOT NULL DEFAULT FALSE,  -- definido por regra de negócio no backend
    logged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_symptoms_patient_date ON symptom_logs(patient_id, logged_at DESC);
CREATE INDEX idx_symptoms_alerts ON symptom_logs(tenant_id, is_alert) WHERE is_alert = TRUE;

-- 7. Prontuário e evolução clínica (registrado pelo médico) -----------------
CREATE TABLE medical_records (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID         NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id  UUID         NOT NULL REFERENCES doctors(id),
    title      VARCHAR(200) NOT NULL,
    notes      TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_records_patient ON medical_records(patient_id, created_at DESC);

-- 8. Prescrições -------------------------------------------------------------
-- No MVP as prescrições são apenas registradas e exibidas.
-- A emissão com assinatura digital ICP-Brasil entra em fase posterior, após
-- validação jurídica e técnica. Por isso o status e a chave do documento assinado
-- já existem, sem gerar validade jurídica antes da hora.
CREATE TABLE prescriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id          UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id           UUID        NOT NULL REFERENCES doctors(id),
    medical_record_id   UUID        REFERENCES medical_records(id) ON DELETE SET NULL,
    content             TEXT        NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'ISSUED', 'SIGNED', 'CANCELLED')),
    signed_document_key VARCHAR(500),                -- caminho no storage do PDF assinado (futuro)
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_prescription_signed CHECK (status <> 'SIGNED' OR signed_document_key IS NOT NULL)
);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id, created_at DESC);

-- 9. Auditoria de acesso e alteração a dados de saúde ------------------------
-- Exigido na prática pela LGPD (segurança e prestação de contas) e pelas normas
-- do CFM sobre prontuário eletrônico. Esta tabela só recebe INSERT pela aplicação.
CREATE TABLE audit_log (
    id            BIGSERIAL PRIMARY KEY,
    tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id UUID        REFERENCES users(id) ON DELETE SET NULL,
    action        VARCHAR(40) NOT NULL,              -- ex.: READ, CREATE, UPDATE, LOGIN
    entity        VARCHAR(60) NOT NULL,              -- ex.: medical_records
    entity_id     UUID,
    ip_address    INET,
    occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_tenant_time ON audit_log(tenant_id, occurred_at DESC);
CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);
