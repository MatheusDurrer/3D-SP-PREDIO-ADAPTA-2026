migrate(
  (app) => {
    try {
      app.findFirstRecordByData('sp3d_config', 'chave', 'principal')
      return
    } catch (_) {}
    const row = new Record(app.findCollectionByNameOrId('sp3d_config'))
    row.set('chave', 'principal')
    row.set('dados', {
      fase: 'validacao_piloto',
      cidade_pronta: false,
      tiles_url: '',
      tiles_versao: '',
      marca: { nome: 'São Paulo 3D', cor_destaque: '#d9ad65', logo_url: '', definitiva: false },
      base_dados: {
        ano_alvo: 2020,
        fonte_primaria: 'GeoSampa MDS/MDT',
        fonte_primaria_validada: false,
      },
      camera_inicial: null,
      origem_local: null,
      pendencias: [
        'Validar coordenada do Marco Zero',
        'Obter e cruzar MDS/MDT2020 e contornos',
        'Validar licenças e CDN',
      ],
      atribuicoes: {
        osm: '© OpenStreetMap contributors (ODbL)',
        prefeitura: 'Prefeitura de São Paulo — GeoSampa',
        obrigatorias: true,
      },
    })
    app.save(row)
  },
  (app) => {},
)
