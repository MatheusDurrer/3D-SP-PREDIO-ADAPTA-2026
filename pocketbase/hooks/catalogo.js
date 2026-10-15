routerAdd('GET', '/backend/v1/sp3d/catalogo', (e) => {
  const map = (rows, fields) =>
    rows.map((r) => {
      const out = { id: r.id, collectionId: r.collection().id }
      for (const f of fields) out[f] = r.get(f)
      return out
    })
  const empreendimentos = map(
    $app.findRecordsByFilter('sp3d_empreendimentos', 'publicado = true', 'ordem,slug', 500, 0),
    [
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
    ],
  )
  const pois = map($app.findRecordsByFilter('sp3d_pois', '', 'nome', 500, 0), [
    'nome',
    'tipo',
    'lat',
    'lng',
    'linha',
  ])
  const marcos = map($app.findRecordsByFilter('sp3d_marcos', '', 'nome', 100, 0), [
    'nome',
    'lat',
    'lng',
    'modelo_glb',
    'mostrar_rotulo',
  ])
  const rows = $app.findRecordsByFilter('sp3d_config', "chave = 'principal'", 'chave', 1, 0)
  let config = { fase: 'validacao_piloto', cidade_pronta: false }
  if (rows.length) {
    const d = JSON.parse(rows[0].getString('dados'))
    if (!d || typeof d !== 'object' || Array.isArray(d))
      throw new InternalServerError('Configuração inválida.')
    config = {
      fase: d.fase,
      cidade_pronta: d.cidade_pronta,
      tiles_url: d.tiles_url,
      tiles_versao: d.tiles_versao,
      marca: d.marca,
      base_dados: d.base_dados,
      camera_inicial: d.camera_inicial,
      origem_local: d.origem_local,
      atribuicoes: d.atribuicoes,
    }
  }
  return e.json(200, { empreendimentos, pois, marcos, config, fase: config.fase })
})
