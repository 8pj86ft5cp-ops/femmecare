// Mock do back-end FemmeCare para testar o front-end sem Java nem PostgreSQL.
// Implementa o contrato de docs/API_CONTRATO.md com dados fictícios em memória.
// NÃO usar em produção. Execute: node --watch server.mjs  (porta 8080)
import http from 'node:http';

const PORT = process.env.PORT ?? 8080;
const DIA = 864e5;

// Contas de teste. Senha de todas: 123456
const CONTAS = [
  { id: 'p1', email: 'paciente@demo.com', password: '123456', name: 'Ana Paciente', role: 'PATIENT' },
  { id: 'd1', email: 'medica@demo.com', password: '123456', name: 'Dra. Beatriz Souza', role: 'DOCTOR' },
  { id: 'a1', email: 'admin@demo.com', password: '123456', name: 'Admin da Clínica', role: 'ADMIN' },
];

const medicos = [
  { id: 'd1', name: 'Dra. Ricardo vital', email: 'medica@demo.com', crm: '12345', crmUf: 'AL', specialty: 'Obstetrícia', active: true },
];

const tenant = {
  name: 'Clínica VITAL',
  logoUrl: null,
  primaryColor: '#f30287',
  domain: 'atendimento.clinicavital.com.br',
};

const iso = (diasAtras) => new Date(Date.now() - diasAtras * DIA).toISOString().slice(0, 10);
const agora = () => new Date().toISOString();

const pacientes = [
  { id: 'p1', name: 'Ana Paciente', dum: iso(100), riskLevel: 'LOW' },
  { id: 'p2', name: 'Carla Mendes', dum: iso(220), riskLevel: 'HIGH' },
  { id: 'p3', name: 'Juliana Rocha', dum: null, riskLevel: 'LOW' },
  { id: 'p4', name: 'Mariana Lopes', dum: iso(250), riskLevel: 'LOW' },
  { id: 'p5', name: 'Fernanda Costa', dum: iso(155), riskLevel: 'HIGH' },
];

const prontuarios = {
  p1: [{
    id: 'r1', title: 'Primeira consulta', notes: 'Gestante em bom estado geral.',
    vitals: { systolic: 118, diastolic: 76, fetalHeartRate: 144, weightKg: 62.5 },
    doctorName: 'Dra. Beatriz Souza', createdAt: agora(),
  }],
};
const prescricoes = {};
const sintomas = [];
const alertas = [
  { id: 'al1', patientId: 'p2', patientName: 'Carla Mendes', symptom: 'Dor de cabeça persistente', severity: 'INTENSA', loggedAt: agora() },
];
const solicitacoes = {
  p1: [
    { id: 'e1', name: 'Hemograma completo', notes: 'Jejum de 8 horas', status: 'PENDING', requestedBy: 'Dra. Beatriz Souza', createdAt: agora() },
    { id: 'e2', name: 'Glicemia de jejum', notes: null, status: 'UPLOADED', requestedBy: 'Dra. Beatriz Souza', createdAt: agora() },
  ],
};
const documentos = [
  { id: 'doc1', patientId: 'p1', type: 'LAB_RESULT', name: 'resultado-exemplo.txt', mimeType: 'text/plain', content: Buffer.from('Resultado de exemplo (dados fictícios).').toString('base64'), examRequestId: null, uploadedBy: 'Dra. Beatriz Souza', createdAt: agora() },
  { id: 'doc2', patientId: 'p1', type: 'ULTRASOUND', name: 'ultrassom-exemplo.txt', mimeType: 'text/plain', content: Buffer.from('Ultrassom de exemplo (dados fictícios).').toString('base64'), examRequestId: null, uploadedBy: 'Dra. Beatriz Souza', createdAt: agora() },
  { id: 'doc3', patientId: 'p1', type: 'PATIENT_EXAM', name: 'glicemia-paciente.txt', mimeType: 'text/plain', content: Buffer.from('Exame enviado pela paciente (dados fictícios).').toString('base64'), examRequestId: 'e2', uploadedBy: 'Ana Paciente', createdAt: agora() },
];
const consultas = {
  p1: { scheduledAt: new Date(Date.now() + 7 * DIA).toISOString(), notes: 'Retorno com revisão de exames', doctorName: 'Dra. Beatriz Souza' },
};
const glicemias = { p1: [{ id: 'g1', value: 88, context: 'JEJUM', measuredAt: agora() }] };
const pressoes = { p1: [{ id: 'pa1', systolic: 118, diastolic: 76, source: 'MEDICO', measuredAt: agora(), dangerous: false }] };

const SINTOMA_ALERTA = /sangramento|tontura|cefaleia|dor de cabe[cç]a/i;
const FAIXAS_VITALS = { systolic: [60, 260], diastolic: [30, 160], fetalHeartRate: [80, 220], weightKg: [30, 250] };
const FAIXAS_PA = { systolic: [60, 260], diastolic: [30, 160] };
const CONTEXTOS_GLICEMIA = ['JEJUM', 'POS_REFEICAO', 'ALEATORIA'];
const TIPOS_DOC_MEDICO = ['ULTRASOUND', 'LAB_RESULT'];
const MIME_PACIENTE = ['application/pdf', 'image/jpeg', 'image/png'];
const LIMITE_BYTES = 10 * 1024 * 1024;

// Limiares de PA em gestação que disparam aviso. Validar com o obstetra antes de produção.
const isPressaoGrave = (s, d) => s >= 160 || d >= 110;

const send = (res, status, corpo, cabecalhos = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...cabecalhos });
  res.end(corpo === undefined ? '' : JSON.stringify(corpo));
};
const lerCorpo = (req) => new Promise((resolve) => {
  let d = '';
  req.on('data', (c) => (d += c));
  req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); } });
});
const contaDaSessao = (req) => {
  const id = /session=([^;]+)/.exec(req.headers.cookie ?? '')?.[1];
  return CONTAS.find((c) => c.id === id) ?? null;
};
const meDe = (c) => ({ id: c.id, name: c.name, email: c.email, role: c.role });
const semConteudo = ({ content, ...resto }) => resto;
const bytesDe = (b64) => Math.floor((b64?.length ?? 0) * 0.75);

// Mesma regra do GestationalCalculator (Java): DPP = DUM + 280 dias
function calcularGestacao(dumStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dumStr ?? '')) return { erro: 'Informe uma data válida.' };
  const dum = new Date(`${dumStr}T00:00:00Z`);
  if (Number.isNaN(dum.getTime())) return { erro: 'Informe uma data válida.' };
  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);
  const dias = Math.round((hoje - dum) / DIA);
  if (dias < 0) return { erro: 'A DUM não pode ser posterior a hoje.' };
  const semanas = Math.floor(dias / 7);
  return {
    resultado: {
      dpp: new Date(dum.getTime() + 280 * DIA).toISOString().slice(0, 10),
      weeks: semanas,
      days: dias % 7,
      trimester: semanas < 14 ? 1 : semanas < 28 ? 2 : 3,
    },
  };
}

function journeyDe(p) {
  if (!p.dum) {
    return { stage: 'PRE_CONCEPTION', weeks: null, days: null, trimester: null, dpp: null, dum: null, progressPercent: null };
  }
  const { resultado } = calcularGestacao(p.dum);
  const dias = resultado.weeks * 7 + resultado.days;
  return {
    stage: 'PRENATAL', ...resultado, dum: p.dum,
    progressPercent: Math.min(100, Math.round((dias / 280) * 1000) / 10),
  };
}

function resumoDe(p) {
  const j = journeyDe(p);
  return { id: p.id, name: p.name, stage: j.stage, weeks: j.weeks, riskLevel: p.riskLevel, dum: p.dum };
}

function validarFaixas(valores, faixas, obrigatorios = []) {
  for (const [campo, [min, max]] of Object.entries(faixas)) {
    const x = valores[campo] ?? null;
    if (x === null && obrigatorios.includes(campo)) return `Informe ${campo}.`;
    if (x !== null && (typeof x !== 'number' || x < min || x > max)) return `Valor fora da faixa esperada em ${campo}.`;
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  const m = req.method;
  const conta = contaDaSessao(req);
  const exige = (...papeis) => {
    if (!conta) { send(res, 401, { message: 'Não autenticado.' }); return false; }
    if (!papeis.includes(conta.role)) { send(res, 403, { message: 'Acesso negado.' }); return false; }
    return true;
  };

  // ---------- Sessão e tenant ----------
  if (m === 'POST' && p === '/api/auth/login') {
    const b = await lerCorpo(req);
    const c = CONTAS.find((x) => x.email === b.email && x.password === b.password);
    if (!c) return send(res, 401, { message: 'Credenciais inválidas.' });
    if (c.role === 'DOCTOR' && medicos.find((x) => x.id === c.id)?.active === false) {
      return send(res, 403, { message: 'Acesso desativado. Procure a administração da clínica.' });
    }
    return send(res, 200, meDe(c), { 'Set-Cookie': `session=${c.id}; HttpOnly; SameSite=Strict; Path=/` });
  }
  if (m === 'POST' && p === '/api/auth/logout') {
    return send(res, 204, undefined, { 'Set-Cookie': 'session=; Max-Age=0; Path=/' });
  }
  if (m === 'GET' && p === '/api/auth/me') {
    return conta ? send(res, 200, meDe(conta)) : send(res, 401, { message: 'Não autenticado.' });
  }
  if (m === 'GET' && p === '/api/tenant/public') return send(res, 200, tenant);
  if (m === 'PUT' && p === '/api/admin/tenant') {
    if (!exige('ADMIN')) return;
    const { domain, ...alteracoes } = await lerCorpo(req);
    Object.assign(tenant, alteracoes);
    return send(res, 200, tenant);
  }

  // ---------- Paciente ----------
  if (p.startsWith('/api/patients/me/')) {
    if (!exige('PATIENT')) return;
    const pac = pacientes.find((x) => x.id === conta.id);
    const sub = p.slice('/api/patients/me/'.length);

    if (m === 'GET' && sub === 'journey') return send(res, 200, journeyDe(pac));
    if (sub === 'symptoms') {
      if (m === 'GET') return send(res, 200, [...sintomas].reverse());
      if (m === 'POST') {
        const b = await lerCorpo(req);
        const novo = { id: `s${sintomas.length + 1}`, symptom: b.symptom, severity: b.severity, isAlert: SINTOMA_ALERTA.test(b.symptom), loggedAt: agora() };
        sintomas.push(novo);
        return send(res, 201, novo);
      }
    }
    if (m === 'POST' && sub === 'kick-sessions') {
      await lerCorpo(req);
      return send(res, 201);
    }
    if (m === 'GET' && sub === 'exam-requests') return send(res, 200, solicitacoes[pac.id] ?? []);
    if (m === 'GET' && sub === 'documents') {
      const tipo = url.searchParams.get('type');
      return send(res, 200, documentos.filter((d) => d.patientId === pac.id && (!tipo || d.type === tipo)).map(semConteudo));
    }
    if (m === 'GET' && sub === 'appointment') return send(res, 200, consultas[pac.id] ?? null);
    if (m === 'GET' && sub === 'prescriptions') {
      return send(res, 200, (prescricoes[pac.id] ?? []).filter((x) => x.status !== 'DRAFT'));
    }
    if (sub === 'glucose') {
      if (m === 'GET') return send(res, 200, [...(glicemias[pac.id] ?? [])].reverse());
      if (m === 'POST') {
        const b = await lerCorpo(req);
        if (typeof b.value !== 'number' || b.value < 20 || b.value > 600) return send(res, 422, { message: 'Glicemia fora da faixa esperada (20 a 600 mg/dL).' });
        if (!CONTEXTOS_GLICEMIA.includes(b.context)) return send(res, 422, { message: 'Escolha o contexto da medição.' });
        const nova = { id: `g${Date.now()}`, value: b.value, context: b.context, measuredAt: agora() };
        (glicemias[pac.id] ??= []).push(nova);
        return send(res, 201, nova);
      }
    }
    if (sub === 'blood-pressure') {
      if (m === 'GET') return send(res, 200, [...(pressoes[pac.id] ?? [])].reverse());
      if (m === 'POST') {
        const b = await lerCorpo(req);
        const erro = validarFaixas(b, FAIXAS_PA, ['systolic', 'diastolic']);
        if (erro) return send(res, 422, { message: erro });
        const grave = isPressaoGrave(b.systolic, b.diastolic);
        const leitura = { id: `pa${Date.now()}`, systolic: b.systolic, diastolic: b.diastolic, source: 'PACIENTE', measuredAt: agora(), dangerous: grave };
        (pressoes[pac.id] ??= []).push(leitura);
        if (grave) {
          // Aviso em tempo real na lista de alertas da médica. O alarme externo (SMS, push) ainda não está ligado.
          alertas.unshift({ id: `al${Date.now()}`, patientId: pac.id, patientName: pac.name, symptom: `Pressão ${b.systolic}/${b.diastolic} mmHg registrada pela paciente`, severity: 'INTENSA', loggedAt: agora() });
        }
        return send(res, 201, { reading: leitura, dangerous: grave, notifiedDoctor: grave, externalNotification: false });
      }
    }
    const up = sub.match(/^exam-requests\/([^/]+)\/documents$/);
    if (up && m === 'POST') {
      const b = await lerCorpo(req);
      const ex = (solicitacoes[pac.id] ?? []).find((x) => x.id === up[1]);
      if (!ex) return send(res, 404, { message: 'Solicitação não encontrada.' });
      if (!MIME_PACIENTE.includes(b.mimeType)) return send(res, 422, { message: 'Envie um arquivo PDF, JPG ou PNG.' });
      if (!b.contentBase64 || bytesDe(b.contentBase64) > LIMITE_BYTES) return send(res, 422, { message: 'O arquivo deve ter até 10 MB.' });
      const doc = { id: `doc${Date.now()}`, patientId: pac.id, type: 'PATIENT_EXAM', name: String(b.name ?? 'arquivo').slice(0, 200), mimeType: b.mimeType, content: b.contentBase64, examRequestId: ex.id, uploadedBy: pac.name, createdAt: agora() };
      documentos.push(doc);
      ex.status = 'UPLOADED';
      return send(res, 201, semConteudo(doc));
    }
  }

  if (m === 'POST' && p === '/api/ai/ask') {
    if (!exige('PATIENT')) return;
    const b = await lerCorpo(req);
    const escalated = SINTOMA_ALERTA.test(b.message ?? '');
    return send(res, 200, {
      escalated,
      answer: escalated
        ? 'Seu relato pode indicar um sintoma de alerta.'
        : `Resposta de demonstração. Você perguntou: "${b.message}". Em produção, a FemmeAI responde com base em diretrizes obstétricas.`,
    });
  }

  // ---------- Médico ----------
  if (m === 'GET' && p === '/api/doctors/alerts') {
    if (!exige('DOCTOR')) return;
    return send(res, 200, alertas);
  }
  if (m === 'GET' && p === '/api/doctors/patients') {
    if (!exige('DOCTOR')) return;
    const risco = url.searchParams.get('risk');
    const lista = pacientes.map(resumoDe);
    return send(res, 200, risco ? lista.filter((x) => x.riskLevel === risco) : lista);
  }

  const rota = p.match(/^\/api\/doctors\/patients\/([^/]+)(?:\/(.+))?$/);
  if (rota) {
    if (!exige('DOCTOR')) return;
    const [, id, sub = ''] = rota;
    const pac = pacientes.find((x) => x.id === id);
    if (!pac) return send(res, 404, { message: 'Paciente não encontrada.' });

    if (!sub && m === 'GET') return send(res, 200, resumoDe(pac));
    if (sub === 'records') {
      if (m === 'GET') return send(res, 200, prontuarios[id] ?? []);
      if (m === 'POST') {
        const b = await lerCorpo(req);
        const erro = validarFaixas(b.vitals ?? {}, FAIXAS_VITALS);
        if (erro) return send(res, 422, { message: erro });
        const vitals = b.vitals ? Object.fromEntries(Object.keys(FAIXAS_VITALS).map((k) => [k, b.vitals[k] ?? null])) : null;
        const novo = { id: `r${Date.now()}`, title: b.title, notes: b.notes, vitals, doctorName: conta.name, createdAt: agora() };
        (prontuarios[id] ??= []).unshift(novo);
        return send(res, 201, novo);
      }
    }
    if (sub === 'prescriptions') {
      if (m === 'GET') return send(res, 200, prescricoes[id] ?? []);
      if (m === 'POST') {
        const b = await lerCorpo(req);
        if (!b.content?.trim()) return send(res, 422, { message: 'Escreva o conteúdo da prescrição.' });
        const nova = { id: `x${Date.now()}`, content: b.content.trim(), status: 'DRAFT', doctorName: conta.name, createdAt: agora() };
        (prescricoes[id] ??= []).unshift(nova);
        return send(res, 201, nova);
      }
    }
    if (sub === 'gestation' && m === 'PUT') {
      const b = await lerCorpo(req);
      const { erro, resultado } = calcularGestacao(b.dum);
      if (erro) return send(res, 422, { message: erro });
      pac.dum = b.dum;
      return send(res, 200, { ...resultado, dum: pac.dum });
    }
    if (sub === 'exam-requests') {
      if (m === 'GET') return send(res, 200, solicitacoes[id] ?? []);
      if (m === 'POST') {
        const b = await lerCorpo(req);
        if (!b.name?.trim()) return send(res, 422, { message: 'Informe o nome do exame.' });
        const nova = { id: `e${Date.now()}`, name: b.name.trim(), notes: b.notes?.trim() || null, status: 'PENDING', requestedBy: conta.name, createdAt: agora() };
        (solicitacoes[id] ??= []).unshift(nova);
        return send(res, 201, nova);
      }
    }
    if (sub === 'documents') {
      if (m === 'GET') return send(res, 200, documentos.filter((d) => d.patientId === id).map(semConteudo));
      if (m === 'POST') {
        const b = await lerCorpo(req);
        if (!TIPOS_DOC_MEDICO.includes(b.type)) return send(res, 422, { message: 'Tipo de documento inválido.' });
        if (!MIME_PACIENTE.includes(b.mimeType)) return send(res, 422, { message: 'Envie um arquivo PDF, JPG ou PNG.' });
        if (!b.contentBase64 || bytesDe(b.contentBase64) > LIMITE_BYTES) return send(res, 422, { message: 'O arquivo deve ter até 10 MB.' });
        const doc = { id: `doc${Date.now()}`, patientId: id, type: b.type, name: String(b.name ?? 'arquivo').slice(0, 200), mimeType: b.mimeType, content: b.contentBase64, examRequestId: null, uploadedBy: conta.name, createdAt: agora() };
        documentos.push(doc);
        return send(res, 201, semConteudo(doc));
      }
    }
    if (sub === 'appointment') {
      if (m === 'GET') return send(res, 200, consultas[id] ?? null);
      if (m === 'PUT') {
        const b = await lerCorpo(req);
        const data = new Date(b.scheduledAt);
        if (!b.scheduledAt || Number.isNaN(data.getTime())) return send(res, 422, { message: 'Informe a data e a hora da consulta.' });
        consultas[id] = { scheduledAt: data.toISOString(), notes: b.notes?.trim() || null, doctorName: conta.name };
        return send(res, 200, consultas[id]);
      }
    }
    if (sub === 'blood-pressure') {
      if (m === 'GET') return send(res, 200, [...(pressoes[id] ?? [])].reverse());
      if (m === 'POST') {
        const b = await lerCorpo(req);
        const erro = validarFaixas(b, FAIXAS_PA, ['systolic', 'diastolic']);
        if (erro) return send(res, 422, { message: erro });
        const leitura = { id: `pa${Date.now()}`, systolic: b.systolic, diastolic: b.diastolic, source: 'MEDICO', measuredAt: agora(), dangerous: isPressaoGrave(b.systolic, b.diastolic) };
        (pressoes[id] ??= []).push(leitura);
        return send(res, 201, leitura);
      }
    }
  }

  // ---------- Documentos e solicitações (acesso por dono ou médico) ----------
  const ex = p.match(/^\/api\/exam-requests\/([^/]+)$/);
  if (ex && m === 'GET') {
    if (!conta) return send(res, 401, { message: 'Não autenticado.' });
    const achado = Object.entries(solicitacoes)
      .flatMap(([pid, lista]) => lista.map((x) => ({ ...x, patientId: pid })))
      .find((x) => x.id === ex[1]);
    if (!achado) return send(res, 404, { message: 'Solicitação não encontrada.' });
    if (conta.role === 'PATIENT' && achado.patientId !== conta.id) return send(res, 403, { message: 'Acesso negado.' });
    const pac = pacientes.find((x) => x.id === achado.patientId);
    return send(res, 200, { id: achado.id, name: achado.name, notes: achado.notes, status: achado.status, requestedBy: achado.requestedBy, createdAt: achado.createdAt, patientName: pac.name, clinicName: tenant.name });
  }

  const dl = p.match(/^\/api\/documents\/([^/]+)\/download$/);
  if (dl && m === 'GET') {
    if (!conta) return send(res, 401, { message: 'Não autenticado.' });
    const doc = documentos.find((x) => x.id === dl[1]);
    if (!doc) return send(res, 404, { message: 'Documento não encontrado.' });
    if (conta.role === 'PATIENT' && doc.patientId !== conta.id) return send(res, 403, { message: 'Acesso negado.' });
    if (conta.role === 'ADMIN') return send(res, 403, { message: 'Acesso negado.' });
    res.writeHead(200, {
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
    });
    return res.end(Buffer.from(doc.content, 'base64'));
  }

  // ---------- Administrador ----------
  if (m === 'GET' && p === '/api/admin/metrics') {
    if (!exige('ADMIN')) return;
    return send(res, 200, { activePatients: pacientes.length, doctors: medicos.length, monthlyUsageRate: 72.5, retentionRate: 88.0 });
  }
  if (p === '/api/admin/doctors') {
    if (!exige('ADMIN')) return;
    if (m === 'GET') return send(res, 200, medicos);
    if (m === 'POST') {
      const b = await lerCorpo(req);
      if (!b.name || !b.email || !b.crm || !b.crmUf || !b.specialty) return send(res, 422, { message: 'Preencha todos os campos.' });
      if (CONTAS.some((c) => c.email === b.email)) return send(res, 409, { message: 'Já existe uma conta com este e-mail.' });
      const novo = { id: `d${medicos.length + 1}`, name: b.name, email: b.email, crm: String(b.crm), crmUf: String(b.crmUf).toUpperCase(), specialty: b.specialty, active: true };
      medicos.push(novo);
      CONTAS.push({ id: novo.id, email: novo.email, password: '123456', name: novo.name, role: 'DOCTOR' });
      return send(res, 201, novo);
    }
  }
  const medico = p.match(/^\/api\/admin\/doctors\/([^/]+)$/);
  if (medico && m === 'PATCH') {
    if (!exige('ADMIN')) return;
    const alvo = medicos.find((x) => x.id === medico[1]);
    if (!alvo) return send(res, 404, { message: 'Médico não encontrado.' });
    const b = await lerCorpo(req);
    if (typeof b.active === 'boolean') alvo.active = b.active;
    return send(res, 200, alvo);
  }

  send(res, 404, { message: 'Rota não encontrada.' });
});

server.listen(PORT, () => console.log(`Mock FemmeCare em http://localhost:${PORT}`));
