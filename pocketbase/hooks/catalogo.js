// catalogo.js — GET /backend/v1/sp3d/catalogo (PRD: hooks do padrão Solaris)
// Uma única chamada entrega empreendimentos publicados + POIs + config.
//
// ALLOWLIST (não serializar o record inteiro): cada collection tem uma lista
// explícita de campos que saem na resposta. Campos novos no schema NUNCA vazam
// por acidente — para expor um campo, ele entra aqui, conscientemente.
//
// Escopo: callbacks rodam em VM separada — lógica 100% inline, sem helpers
// top-level. $app (não app). Rota sob /backend/v1/ (nunca /api/).
routerAdd(
  'GET',
  '/backend/v1/sp3d/catalogo',
  (e) => {
    const EMP_FIELDS = [
      'id',
      'slug',
      'nome',
      'status',
      'ano_entrega',
      'endereco',
      'bairro',
      'lat',
      'lng',
      'area_min',
      'area_max',
      'dorms',
      'suites',
      'fotos',
      'capa',
      'modelo_glb',
      'altura_m',
      'rotacao_graus',
      'cor_destaque',
      'ordem',
      'publicado',
    ]
    const POI_FIELDS = ['id', 'nome', 'tipo', 'lat', 'lng', 'linha']
    const MARCO_FIELDS = ['id', 'nome', 'lat', 'lng', 'modelo_glb', 'mostrar_rotulo']
    const CFG_FIELDS = ['id', 'chave', 'dados']

    const pick = (rec, fields) => {
      const out = {}
      for (let i = 0; i < fields.length; i++) {
        out[fields[i]] = rec.get(fields[i])
      }
      return out
    }

    const emps = $app.findRecordsByFilter(
      'sp3d_empreendimentos',
      'publicado = true',
      'ordem,created',
      500,
      0,
    )
    const pois = $app.findRecordsByFilter('sp3d_pois', '', 'nome', 500, 0)
    const marcos = $app.findRecordsByFilter('sp3d_marcos', '', 'nome', 100, 0)
    const configs = $app.findRecordsByFilter('sp3d_config', '', 'chave', 50, 0)

    // Fase declarada no config (fonte única) — fallback defensivo se o seed
    // ainda não rodou. NUNCA hardcode de fase no código.
    let fase = 'validacao_piloto'
    for (let i = 0; i < configs.length; i++) {
      try {
        const dados = JSON.parse(configs[i].getString('dados'))
        if (dados && dados.fase) fase = String(dados.fase)
      } catch (_) {}
    }

    const listaEmps = []
    for (let i = 0; i < emps.length; i++) listaEmps.push(pick(emps[i], EMP_FIELDS))
    const listaPois = []
    for (let i = 0; i < pois.length; i++) listaPois.push(pick(pois[i], POI_FIELDS))
    const listaMarcos = []
    for (let i = 0; i < marcos.length; i++) listaMarcos.push(pick(marcos[i], MARCO_FIELDS))
    const listaCfg = []
    for (let i = 0; i < configs.length; i++) {
      const c = pick(configs[i], CFG_FIELDS)
      // json field: get() devolve bytes crus — ler via getString + JSON.parse.
      try {
        c.dados = JSON.parse(configs[i].getString('dados')) ?? {}
      } catch (_) {
        c.dados = {}
      }
      listaCfg.push(c)
    }

    return e.json(200, {
      empreendimentos: listaEmps,
      pois: listaPois,
      marcos: listaMarcos,
      config: listaCfg,
      // Fase do produto vem do registro sp3d_config (fonte única) — cidade não
      // pronta até o piloto de dados do eixo sudoeste passar no portão (PRD).
      fase: fase,
    })
  },
  // Público por design (catálogo da vitrine), sem middleware de auth.
)
