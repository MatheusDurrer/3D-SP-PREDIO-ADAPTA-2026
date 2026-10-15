// registra_evento.js — POST /backend/v1/sp3d/evento (métricas do PRD)
// Telemetria da vitrine: sessao, abriu_imovel, ver_calcada, lead.
// Rate limit POR IP no BANCO (mesma lição do captura_lead: memória de VM do
// pool não persiste). Escrita direta em sp3d_eventos (createRule null = só o
// hook via superuser; anon direto na collection não passa).
routerAdd('POST', '/backend/v1/sp3d/evento', (e) => {
  const d = new DynamicModel({ tipo: '', empreendimento: '', dispositivo: '', duracao_s: 0 })
  e.bindBody(d)

  const tipo = String(d.tipo || '').trim()
  const empId = String(d.empreendimento || '').trim()
  const dispositivo = String(d.dispositivo || '')
    .trim()
    .slice(0, 40)
  let duracao = Number(d.duracao_s)

  // Validação na trust boundary.
  const tipos = ['sessao', 'abriu_imovel', 'ver_calcada', 'lead']
  let tipoOk = false
  for (let i = 0; i < tipos.length; i++) {
    if (tipos[i] === tipo) tipoOk = true
  }
  if (!tipoOk) {
    return e.json(400, { error: 'tipo inválido.' })
  }
  if (!Number.isFinite(duracao) || duracao < 0) {
    return e.json(400, { error: 'duracao_s inválido.' })
  }
  if (duracao > 86400) duracao = 86400 // cap: 1 dia (payload de telemetria, não cronômetro de verdade)

  // Rate limit no banco: máx. 120 eventos por IP a cada 10 minutos.
  // IP REAL: mesma política do captura_lead — remoteAddr primeiro; XFF só o
  // ÚLTIMO salto e apenas quando o remoteAddr é do edge (privado/loopback).
  // Primeiro salto de XFF é forjável pelo cliente — nunca usar.
  let ip = String(e.request.remoteAddr || '').trim()
  if (ip.indexOf('.') !== -1) {
    const idx = ip.lastIndexOf(':')
    if (idx !== -1) ip = ip.slice(idx + 1)
  }
  const info = e.requestInfo()
  const hdrs = info && info.headers ? info.headers : {}
  const xff = String(hdrs['x-forwarded-for'] || hdrs['X-Forwarded-For'] || '').trim()
  const privado =
    ip === '' ||
    ip.indexOf('10.') === 0 ||
    ip.indexOf('192.168.') === 0 ||
    ip.indexOf('127.') === 0 ||
    ip.indexOf('::1') === 0 ||
    ip.indexOf('172.') === 0
  if (privado && xff !== '') {
    const saltos = xff.split(',')
    ip = saltos[saltos.length - 1].trim().slice(0, 45)
  }
  const ipHash = $security.sha256('sp3d-ip:' + ip)
  const limite = $app.findRecordsByFilter(
    'sp3d_eventos',
    'ip_hash = "' +
      ipHash +
      '" && created > "' +
      new Date(Date.now() - 10 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) +
      '.000Z"',
    '-created',
    121,
    0,
  )
  if (limite.length >= 120) {
    return e.json(429, { error: 'Muitos eventos. Aguarde alguns minutos.' })
  }

  // Empreendimento opcional: aceita id ou slug publicado.
  let emp = null
  if (empId !== '') {
    try {
      emp = $app.findRecordById('sp3d_empreendimentos', empId)
      if (!emp.getBool('publicado')) emp = null
    } catch (_) {
      try {
        emp = $app.findFirstRecordByFilter(
          'sp3d_empreendimentos',
          'slug = "' + empId.replace(/"/g, '') + '" && publicado = true',
        )
      } catch (_) {
        emp = null
      }
    }
  }

  const col = $app.findCollectionByNameOrId('sp3d_eventos')
  const rec = new Record(col)
  rec.set('tipo', tipo)
  rec.set('dispositivo', dispositivo)
  rec.set('duracao_s', duracao)
  rec.set('ip_hash', ipHash)
  if (emp) rec.set('empreendimento', emp.id)
  $app.save(rec)

  return e.json(201, { ok: true })
})
