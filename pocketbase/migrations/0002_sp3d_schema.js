migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (!users.fields.getByName('papel'))
      users.fields.add(
        new SelectField({ name: 'papel', values: ['admin'], maxSelect: 1, required: true }),
      )
    users.createRule = null
    users.deleteRule = null
    users.listRule = 'id = @request.auth.id'
    users.viewRule = users.listRule
    users.updateRule = 'id = @request.auth.id && @request.body.papel:changed = false'
    app.save(users)
    const admin = "@request.auth.id != '' && @request.auth.papel = 'admin'"
    const pub = "publicado = true || (@request.auth.id != '' && @request.auth.papel = 'admin')"
    try {
      app.findCollectionByNameOrId('sp3d_empreendimentos')
    } catch (_) {
      app.save(
        new Collection({
          name: 'sp3d_empreendimentos',
          type: 'base',
          listRule: pub,
          viewRule: pub,
          createRule: admin,
          updateRule: admin,
          deleteRule: admin,
          indexes: ['CREATE UNIQUE INDEX idx_sp3d_emp_slug ON sp3d_empreendimentos (slug)'],
          fields: [
            {
              name: 'slug',
              type: 'text',
              required: true,
              max: 80,
              pattern: '^[a-z0-9]+(-[a-z0-9]+)*$',
            },
            { name: 'nome', type: 'text', required: true, max: 120 },
            {
              name: 'status',
              type: 'select',
              values: ['lancamento', 'obras', 'futuro', 'entregue'],
              maxSelect: 1,
              required: true,
            },
            { name: 'ano_entrega', type: 'number', min: 1800, max: 2100, onlyInt: true },
            { name: 'endereco', type: 'text', required: true, max: 200 },
            { name: 'bairro', type: 'text', required: true, max: 80 },
            { name: 'lat', type: 'number', required: true, min: -24.1, max: -23.2 },
            { name: 'lng', type: 'number', required: true, min: -47, max: -46.1 },
            { name: 'area_min', type: 'number', min: 0 },
            { name: 'area_max', type: 'number', min: 0 },
            { name: 'dorms', type: 'number', min: 0, max: 10, onlyInt: true },
            { name: 'suites', type: 'number', min: 0, max: 10, onlyInt: true },
            {
              name: 'fotos',
              type: 'file',
              maxSelect: 12,
              maxSize: 10485760,
              mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            },
            {
              name: 'capa',
              type: 'file',
              maxSelect: 1,
              maxSize: 10485760,
              mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            },
            {
              name: 'modelo_glb',
              type: 'file',
              maxSelect: 1,
              maxSize: 52428800,
              mimeTypes: ['model/gltf-binary'],
            },
            { name: 'altura_m', type: 'number', min: 0, max: 1000 },
            { name: 'rotacao_graus', type: 'number', min: 0, max: 360 },
            { name: 'cor_destaque', type: 'text', max: 7, pattern: '^#[0-9a-fA-F]{6}$' },
            { name: 'ordem', type: 'number', min: 0, onlyInt: true },
            { name: 'publicado', type: 'bool' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
      )
    }
    try {
      app.findCollectionByNameOrId('sp3d_pois')
    } catch (_) {
      app.save(
        new Collection({
          name: 'sp3d_pois',
          type: 'base',
          listRule: '',
          viewRule: '',
          createRule: admin,
          updateRule: admin,
          deleteRule: admin,
          fields: [
            { name: 'nome', type: 'text', required: true, max: 120 },
            {
              name: 'tipo',
              type: 'select',
              values: ['metro', 'trem', 'hospital', 'parque', 'escola', 'shopping'],
              maxSelect: 1,
              required: true,
            },
            { name: 'lat', type: 'number', required: true, min: -24.1, max: -23.2 },
            { name: 'lng', type: 'number', required: true, min: -47, max: -46.1 },
            { name: 'linha', type: 'text', max: 60 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
      )
    }
    try {
      app.findCollectionByNameOrId('sp3d_distancias')
    } catch (_) {
      const emp = app.findCollectionByNameOrId('sp3d_empreendimentos').id
      const poi = app.findCollectionByNameOrId('sp3d_pois').id
      const read =
        "empreendimento.publicado = true || (@request.auth.id != '' && @request.auth.papel = 'admin')"
      app.save(
        new Collection({
          name: 'sp3d_distancias',
          type: 'base',
          listRule: read,
          viewRule: read,
          createRule: null,
          updateRule: null,
          deleteRule: null,
          indexes: [
            'CREATE UNIQUE INDEX idx_sp3d_dist_par ON sp3d_distancias (empreendimento, poi)',
          ],
          fields: [
            {
              name: 'empreendimento',
              type: 'relation',
              collectionId: emp,
              maxSelect: 1,
              cascadeDelete: true,
              required: true,
            },
            {
              name: 'poi',
              type: 'relation',
              collectionId: poi,
              maxSelect: 1,
              cascadeDelete: true,
              required: true,
            },
            { name: 'metros', type: 'number', min: 0 },
            { name: 'minutos_a_pe', type: 'number', min: 0 },
            { name: 'rota_validada', type: 'bool' },
            { name: 'metodo', type: 'text', max: 20 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
      )
    }
    try {
      app.findCollectionByNameOrId('sp3d_marcos')
    } catch (_) {
      app.save(
        new Collection({
          name: 'sp3d_marcos',
          type: 'base',
          listRule: '',
          viewRule: '',
          createRule: admin,
          updateRule: admin,
          deleteRule: admin,
          fields: [
            { name: 'nome', type: 'text', required: true, max: 120 },
            { name: 'lat', type: 'number', required: true, min: -24.1, max: -23.2 },
            { name: 'lng', type: 'number', required: true, min: -47, max: -46.1 },
            {
              name: 'modelo_glb',
              type: 'file',
              maxSelect: 1,
              maxSize: 52428800,
              mimeTypes: ['model/gltf-binary'],
            },
            { name: 'mostrar_rotulo', type: 'bool' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
      )
    }
    try {
      app.findCollectionByNameOrId('sp3d_config')
    } catch (_) {
      app.save(
        new Collection({
          name: 'sp3d_config',
          type: 'base',
          listRule: '',
          viewRule: '',
          createRule: admin,
          updateRule: admin,
          deleteRule: admin,
          indexes: ['CREATE UNIQUE INDEX idx_sp3d_config_chave ON sp3d_config (chave)'],
          fields: [
            { name: 'chave', type: 'text', required: true, max: 60 },
            { name: 'dados', type: 'json', required: true, maxSize: 2000000 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
      )
    }
    try {
      app.findCollectionByNameOrId('sp3d_leads')
    } catch (_) {
      const emp = app.findCollectionByNameOrId('sp3d_empreendimentos').id
      app.save(
        new Collection({
          name: 'sp3d_leads',
          type: 'base',
          listRule: admin,
          viewRule: admin,
          createRule: null,
          updateRule: null,
          deleteRule: admin,
          indexes: ['CREATE INDEX idx_sp3d_leads_emp ON sp3d_leads (empreendimento, created)'],
          fields: [
            { name: 'nome', type: 'text', required: true, max: 120 },
            {
              name: 'telefone',
              type: 'text',
              required: true,
              min: 10,
              max: 20,
              pattern: '^[0-9+() -]{10,20}$',
            },
            { name: 'email', type: 'email' },
            { name: 'mensagem', type: 'text', max: 2000 },
            { name: 'empreendimento', type: 'relation', collectionId: emp, maxSelect: 1 },
            {
              name: 'origem',
              type: 'select',
              values: ['formulario', 'whatsapp'],
              maxSelect: 1,
              required: true,
            },
            { name: 'ip_hash', type: 'text', max: 64 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
      )
    }
    try {
      app.findCollectionByNameOrId('sp3d_eventos')
    } catch (_) {
      const emp = app.findCollectionByNameOrId('sp3d_empreendimentos').id
      app.save(
        new Collection({
          name: 'sp3d_eventos',
          type: 'base',
          listRule: admin,
          viewRule: admin,
          createRule: null,
          updateRule: null,
          deleteRule: null,
          indexes: ['CREATE INDEX idx_sp3d_ev_tipo ON sp3d_eventos (tipo, created)'],
          fields: [
            {
              name: 'tipo',
              type: 'select',
              values: ['sessao', 'abriu_imovel', 'ver_calcada', 'lead'],
              maxSelect: 1,
              required: true,
            },
            { name: 'empreendimento', type: 'relation', collectionId: emp, maxSelect: 1 },
            { name: 'dispositivo', type: 'text', max: 40 },
            { name: 'duracao_s', type: 'number', min: 0, max: 86400, onlyInt: true },
            { name: 'ip_hash', type: 'text', max: 64 },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
        }),
      )
    }
  },
  (app) => {
    for (const name of [
      'sp3d_eventos',
      'sp3d_leads',
      'sp3d_config',
      'sp3d_marcos',
      'sp3d_distancias',
      'sp3d_pois',
      'sp3d_empreendimentos',
    ]) {
      try {
        app.delete(app.findCollectionByNameOrId(name))
      } catch (_) {}
    }
  },
)
