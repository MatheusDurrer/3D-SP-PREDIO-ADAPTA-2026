// captura_lead.js — POST /backend/v1/sp3d/lead (RF-14, RNF-10)
// Grava o lead com empreendimento de origem, protegido contra spam:
//   1. honeypot: campo oculto preenchido = bot → 200 silencioso
//   2. rate limit POR IP no BANCO (não em memória de VM — pool não persiste)
//   3. validação de campos na trust boundary (400, nunca 500)
//
// bindBody conforme guia de hooks (§5 RequestEvent): DynamicModel +
// e.bindBody(d). O body via requestInfo().body NÃO é confiável para POST no
// runtime Goja; bindBody é o caminho tipado do guia.
//
// IP: e.request.remoteAddr (campo, sem parênteses). Hash via $security.sha256.
routerAdd('POST', '/backend/v1/sp3d/lead', (e) => {
  const d = new DynamicModel({
    nome: '',
    telefone: '',
    email: '',
    mensagem: '',
    empreendimento: '',
    origem: 'formulario',
    website: '',
  })
  e.bindBody(d)

  // 1. Honeypot — bots preenchem o campo oculto "website".
  if ((d.website || '').length > 0) {
    return e.json(200, { ok: true }) // resposta indistinguível de sucesso
  }

  const nome = String(d.nome || '').trim()
  const telefone = String(d.telefone || '').trim()
  const email = String(d.email || '').trim()
  const mensagem = String(d.mensagem || '').trim()
  const empSlugOuId = String(d.empreendimento || '').trim()
  const origem = String(d.origem || 'formulario').trim()

  // 2. Validações (400 com mapa por campo).
  const erros = {}
  if (nome.length < 2 || nome.length > 120) erros.nome = 'Informe seu nome (2-120 caracteres).'
  if (!/^[0-9+()\- ]{10,20}$/.test(telefone)) erros.telefone = 'Telefone inválido.'
  if (email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = 'E-mail inválido.'
  if (mensagem.length > 2000) erros.mensagem = 'Mensagem muito longa (máx. 2000).'
  if (origem !== 'formulario' && origem !== 'whatsapp') erros.origem = 'Origem inválida.'
  if (Object.keys(erros).length > 0) {
    return e.json(400, { error: 'Dados inválidos.', fields: erros })
  }

  // 3. Rate limit no banco: máx. 5 leads por IP a cada 10 minutos.
  // IP REAL: remoteAddr é a verdade do socket. X-Forwarded-For é controlado
  // pelo cliente — o PRIMEIRO salto é forjável e NUNCA é usado. Só se o
  // remoteAddr for do edge (rede privada/loopback) é que se olha o XFF, e
  // mesmo assim o ÚLTIMO salto (o que o NOSSO edge acrescentou).
  let ip = String(e.request.remoteAddr || '').trim()
  if (ip.indexOf('.') !== -1) {
    const idx = ip.lastIndexOf(':')
    if (idx !== -1) ip = ip.slice(idx + 1) // IPv4/IPv4-mapped: parte após ':'
  } // IPv6 puro: entra inteiro no hash
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
    'sp3d_leads',
    'ip_hash = "' +
      ipHash +
      '" && created > "' +
      new Date(Date.now() - 10 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) +
      '.000Z"',
    '-created',
    5,
    0,
  )
  if (limite.length >= 5) {
    return e.json(429, { error: 'Muitas tentativas. Aguarde alguns minutos.' })
  }

  // 4. Resolução do empreendimento por id OU slug (só publicados).
  let emp = null
  if (empSlugOuId !== '') {
    try {
      emp = $app.findRecordById('sp3d_empreendimentos', empSlugOuId)
      if (!emp.getBool('publicado')) emp = null
    } catch (_) {
      try {
        emp = $app.findFirstRecordByFilter(
          'sp3d_empreendimentos',
          'slug = "' + empSlugOuId.replace(/"/g, '') + '" && publicado = true',
        )
      } catch (_) {
        emp = null
      }
    }
  }

  // 5. Gravação. createRule de sp3d_leads é null (superuser) — $app.save
  // do hook roda como superuser, então a escrita passa; anon via API não passa.
  const col = $app.findCollectionByNameOrId('sp3d_leads')
  const rec = new Record(col)
  rec.set('nome', nome)
  rec.set('telefone', telefone)
  rec.set('email', email)
  rec.set('mensagem', mensagem)
  rec.set('origem', origem)
  rec.set('ip_hash', ipHash)
  if (emp) rec.set('empreendimento', emp.id)
  $app.save(rec)

  return e.json(201, { ok: true, id: rec.id })
})
