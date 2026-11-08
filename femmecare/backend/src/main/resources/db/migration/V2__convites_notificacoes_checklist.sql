-- Recursos de convite, checklist, notificações e pedidos LGPD.

ALTER TABLE users ADD COLUMN password_setup_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ADD CONSTRAINT chk_users_password_setup
    CHECK (
        (password_setup_required AND role = 'PATIENT' AND password_hash IS NULL)
        OR
        (NOT password_setup_required AND password_hash IS NOT NULL)
    );

CREATE TABLE patient_invitations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id    UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    token_hash    BYTEA       NOT NULL UNIQUE CHECK (octet_length(token_hash) = 32),
    created_by    UUID        NOT NULL REFERENCES users(id),
    expires_at    TIMESTAMPTZ NOT NULL,
    used_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_patient_invitations_expiry ON patient_invitations(expires_at) WHERE used_at IS NULL;

CREATE TABLE birth_plan_checklist (
    tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id   UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    item_id      VARCHAR(60) NOT NULL,
    is_checked   BOOLEAN     NOT NULL DEFAULT FALSE,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (patient_id, item_id)
);
CREATE INDEX idx_birth_plan_tenant_patient ON birth_plan_checklist(tenant_id, patient_id);

CREATE TABLE patient_notification_reads (
    tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id   UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    section      VARCHAR(30) NOT NULL CHECK (section IN ('documents', 'appointment')),
    read_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (patient_id, section)
);

CREATE TABLE doctor_alert_reads (
    tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    doctor_id      UUID        NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    source_entity  VARCHAR(60) NOT NULL,
    source_id      UUID        NOT NULL,
    read_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (doctor_id, source_entity, source_id)
);
CREATE INDEX idx_doctor_alert_reads_tenant ON doctor_alert_reads(tenant_id, doctor_id);

CREATE TABLE patient_data_deletion_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id      UUID        NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'IN_REVIEW', 'COMPLETED', 'DENIED')),
    requested_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by     UUID        REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    resolution_note TEXT
);
CREATE INDEX idx_deletion_requests_tenant_status ON patient_data_deletion_requests(tenant_id, status, requested_at DESC);
CREATE UNIQUE INDEX uq_patient_pending_deletion_request
    ON patient_data_deletion_requests(patient_id) WHERE status = 'PENDING';
