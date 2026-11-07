// Contratos de resposta do back-end. Ver docs/API_CONTRATO.md.

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';
export type Stage = 'PRE_CONCEPTION' | 'PRENATAL' | 'POSTPARTUM';
export type Severity = 'LEVE' | 'MODERADA' | 'INTENSA';
export type RiskLevel = 'LOW' | 'HIGH';
export type PrescriptionStatus = 'DRAFT' | 'ISSUED' | 'SIGNED' | 'CANCELLED';
export type DocumentType = 'ULTRASOUND' | 'LAB_RESULT' | 'PATIENT_EXAM';
export type GlucoseContext = 'JEJUM' | 'POS_REFEICAO' | 'ALEATORIA';
export type ExamStatus = 'PENDING' | 'UPLOADED';

export interface Me {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Tenant {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  domain: string; // definido na infraestrutura, somente leitura no painel
}

export interface Journey {
  stage: Stage;
  weeks: number | null;
  days: number | null;
  trimester: number | null;
  dpp: string | null;
  dum: string | null;
  progressPercent: number | null;
}

export interface CalcResult {
  dum: string;
  dpp: string;
  weeks: number;
  days: number;
  trimester: number;
}

export interface SymptomLog {
  id: string;
  symptom: string;
  severity: Severity;
  isAlert: boolean;
  loggedAt: string;
}

export interface AiAnswer {
  answer: string;
  escalated: boolean;
}

export interface PatientSummary {
  id: string;
  name: string;
  stage: Stage;
  weeks: number | null;
  riskLevel: RiskLevel;
  dum: string | null;
}

export interface AlertItem {
  id: string;
  patientId: string;
  patientName: string;
  symptom: string;
  severity: Severity;
  loggedAt: string;
}

export interface Vitals {
  systolic: number | null;
  diastolic: number | null;
  fetalHeartRate: number | null;
  weightKg: number | null;
}

export interface MedicalRecord {
  id: string;
  title: string;
  notes: string;
  vitals: Vitals | null;
  doctorName: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  content: string;
  status: PrescriptionStatus;
  doctorName: string;
  createdAt: string;
}

export interface ExamRequest {
  id: string;
  name: string;
  notes: string | null;
  status: ExamStatus;
  requestedBy: string;
  createdAt: string;
}

export interface Documento {
  id: string;
  type: DocumentType;
  name: string;
  mimeType: string;
  examRequestId: string | null;
  uploadedBy: string;
  createdAt: string;
}

export interface Appointment {
  scheduledAt: string;
  notes: string | null;
  doctorName: string;
}

export interface GlucoseReading {
  id: string;
  value: number;
  context: GlucoseContext;
  measuredAt: string;
}

export interface BloodPressureReading {
  id: string;
  systolic: number;
  diastolic: number;
  source: 'PACIENTE' | 'MEDICO';
  measuredAt: string;
  dangerous: boolean;
}

export interface BloodPressureResult {
  reading: BloodPressureReading;
  dangerous: boolean;
  notifiedDoctor: boolean;
  externalNotification: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  crm: string;
  crmUf: string;
  specialty: string;
  active: boolean;
}

export interface Metrics {
  activePatients: number;
  doctors: number;
  monthlyUsageRate: number;
  retentionRate: number;
}
