import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const serverFile = fileURLToPath(new URL('../server.mjs', import.meta.url));
let server;
let baseUrl;
let doctorCookie;
let patientCookie;
let patientId;
let invitationToken;

async function portLivre() {
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const { port } = listener.address();
  await new Promise((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function requisitar(caminho, { method = 'GET', body, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(`${baseUrl}${caminho}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(3000),
  });
  const texto = await response.text();
  return {
    status: response.status,
    body: texto ? JSON.parse(texto) : null,
    cookie: response.headers.get('set-cookie')?.split(';')[0],
  };
}

async function entrar(email, password) {
  const response = await requisitar('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  assert.equal(response.status, 200);
  return response.cookie;
}

before(async () => {
  const port = await portLivre();
  baseUrl = `http://127.0.0.1:${port}/api`;
  server = spawn(process.execPath, [serverFile], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let stderr = '';
  server.stderr.setEncoding('utf8');
  server.stderr.on('data', (data) => { stderr += data; });

  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Mock encerrou antes de iniciar: ${stderr}`);
    try {
      const response = await fetch(`${baseUrl}/tenant/public`, { signal: AbortSignal.timeout(300) });
      if (response.ok) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const health = await fetch(`${baseUrl}/tenant/public`);
  assert.equal(health.status, 200);
  doctorCookie = await entrar('medica@demo.com', '123456');
});

after(() => {
  server?.kill();
});

test('médica cria paciente, paciente aceita termo e define senha por convite de uso único', async () => {
  const birthDate = new Date(Date.now() - 30 * 365 * 864e5).toISOString().slice(0, 10);
  const dum = new Date(Date.now() - 40 * 864e5).toISOString().slice(0, 10);
  const cadastro = await requisitar('/doctors/patients', {
    method: 'POST',
    cookie: doctorCookie,
    body: {
      name: 'Paciente de integração',
      email: 'integracao@example.com',
      birthDate,
      stage: 'PRENATAL',
      dum,
      riskLevel: 'LOW',
    },
  });
  assert.equal(cadastro.status, 201);
  patientId = cadastro.body.patient.id;
  invitationToken = cadastro.body.invitationToken;
  assert.ok(invitationToken);

  const validacao = await requisitar('/auth/first-access/validate', {
    method: 'POST',
    body: { token: invitationToken },
  });
  assert.equal(validacao.status, 200);
  assert.equal(validacao.body.email, 'integracao@example.com');

  const semAceite = await requisitar('/auth/first-access', {
    method: 'POST',
    body: { token: invitationToken, password: 'senha-segura-123' },
  });
  assert.equal(semAceite.status, 422);

  const primeiroAcesso = await requisitar('/auth/first-access', {
    method: 'POST',
    body: {
      token: invitationToken,
      password: 'senha-segura-123',
      consentAccepted: true,
      consentVersion: '1.0-provisorio',
    },
  });
  assert.equal(primeiroAcesso.status, 204);
  const reutilizado = await requisitar('/auth/first-access/validate', {
    method: 'POST',
    body: { token: invitationToken },
  });
  assert.equal(reutilizado.status, 410);

  patientCookie = await entrar('integracao@example.com', 'senha-segura-123');
  const me = await requisitar('/auth/me', { cookie: patientCookie });
  assert.equal(me.body.consentRequired, false);
});

test('notificações, checklist e agenda ficam sincronizados entre os papéis', async () => {
  const appointmentAt = new Date(Date.now() + 3 * 864e5);
  appointmentAt.setUTCHours(15, 0, 0, 0);
  const scheduledAt = appointmentAt.toISOString();
  const data = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(appointmentAt);
  const appointment = await requisitar(`/doctors/patients/${patientId}/appointment`, {
    method: 'PUT',
    cookie: doctorCookie,
    body: { scheduledAt, notes: 'Consulta de integração' },
  });
  assert.equal(appointment.status, 200);

  const appointmentNotice = await requisitar('/patients/me/notifications', { cookie: patientCookie });
  assert.equal(appointmentNotice.body.appointment, 1);
  const agenda = await requisitar(`/doctors/appointments?date=${data}`, { cookie: doctorCookie });
  assert.equal(agenda.status, 200);
  assert.ok(agenda.body.some((item) => item.patientId === patientId));

  const checklist = await requisitar('/patients/me/birth-plan-checklist', { cookie: patientCookie });
  assert.equal(checklist.status, 200);
  assert.ok(checklist.body.length > 0);
  const item = checklist.body[0];
  const marcado = await requisitar('/patients/me/birth-plan-checklist', {
    method: 'PUT',
    cookie: patientCookie,
    body: { itemId: item.id, checked: true },
  });
  assert.equal(marcado.body.checked, true);
  const checklistClinica = await requisitar(
    `/doctors/patients/${patientId}/birth-plan-checklist`,
    { cookie: doctorCookie },
  );
  assert.equal(checklistClinica.body[0].checked, true);

  const lido = await requisitar('/patients/me/notifications/read', {
    method: 'POST',
    cookie: patientCookie,
    body: { section: 'appointment' },
  });
  assert.equal(lido.status, 204);
  const semNovidades = await requisitar('/patients/me/notifications', { cookie: patientCookie });
  assert.equal(semNovidades.body.appointment, 0);

  const documento = await requisitar(`/doctors/patients/${patientId}/documents`, {
    method: 'POST',
    cookie: doctorCookie,
    body: {
      type: 'LAB_RESULT',
      name: 'resultado-teste.pdf',
      mimeType: 'application/pdf',
      contentBase64: Buffer.from('resultado de teste').toString('base64'),
    },
  });
  assert.equal(documento.status, 201);
  const documentoNovo = await requisitar('/patients/me/notifications', { cookie: patientCookie });
  assert.equal(documentoNovo.body.documents, 1);
  const documentosLidos = await requisitar('/patients/me/notifications/read', {
    method: 'POST',
    cookie: patientCookie,
    body: { section: 'documents' },
  });
  assert.equal(documentosLidos.status, 204);
  const nenhumDocumentoNovo = await requisitar('/patients/me/notifications', { cookie: patientCookie });
  assert.equal(nenhumDocumentoNovo.body.documents, 0);
});

test('alertas podem ser lidos e auditados; exportação e pedido LGPD são registrados', async () => {
  const alertas = await requisitar('/doctors/alerts', { cookie: doctorCookie });
  assert.ok(alertas.body.some((item) => item.id === 'al1'));
  const leitura = await requisitar('/doctors/alerts/al1/read', {
    method: 'POST',
    cookie: doctorCookie,
    body: {},
  });
  assert.equal(leitura.status, 204);
  const alertasPendentes = await requisitar('/doctors/alerts', { cookie: doctorCookie });
  assert.ok(!alertasPendentes.body.some((item) => item.id === 'al1'));

  const prontuario = await requisitar(`/doctors/patients/${patientId}/records`, { cookie: doctorCookie });
  assert.equal(prontuario.status, 200);
  const exportacao = await requisitar('/patients/me/data-export', { cookie: patientCookie });
  assert.equal(exportacao.status, 200);
  assert.equal(exportacao.body.patient.id, patientId);
  assert.equal(exportacao.body.patient.email, 'integracao@example.com');
  assert.ok(exportacao.body.consents.some((item) => item.purpose === 'TERMOS_USO'));
  assert.ok(exportacao.body.documents.some((item) => item.name === 'resultado-teste.pdf' && item.content));

  const pedido = await requisitar('/patients/me/deletion-request', {
    method: 'POST',
    cookie: patientCookie,
    body: {},
  });
  assert.equal(pedido.status, 201);
  const pedidoRepetido = await requisitar('/patients/me/deletion-request', {
    method: 'POST',
    cookie: patientCookie,
    body: {},
  });
  assert.equal(pedidoRepetido.status, 200);
  assert.equal(pedidoRepetido.body.id, pedido.body.id);

  const adminCookie = await entrar('admin@demo.com', '123456');
  const auditoria = await requisitar('/admin/audit-log', { cookie: adminCookie });
  assert.equal(auditoria.status, 200);
  assert.ok(auditoria.body.some((item) => item.patientName === 'Paciente de integração'));
  assert.ok(auditoria.body.some((item) => item.action === 'EXPORT'));
  const pedidos = await requisitar('/admin/deletion-requests', { cookie: adminCookie });
  assert.equal(pedidos.status, 200);
  assert.ok(pedidos.body.some((item) => item.patientName === 'Paciente de integração'));
});
