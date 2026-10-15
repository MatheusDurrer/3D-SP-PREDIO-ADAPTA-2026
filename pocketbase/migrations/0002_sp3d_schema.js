migrate(
  (app) => {
    const admin = "@request.auth.id != '' && @request.auth.papel = 'admin'"
    const pub = 'publicado = true || (' + admin + ')'
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
    const text = (name, max = 120, required = false) => ({ name, type: 'text', max, required })
    const num = (name, min = 0, max = 100000, onlyInt = false) => ({
      name,
      type: 'number',
      min,
      max,
      onlyInt,
    })

    const file = (name, maxSelect, mimeTypes, maxSize) => ({
      name,
      type: 'file',
      maxSelect,
      mimeTypes,
      maxSize,
    })
    const coord = () => [num('lat', -24.1, -23.2), num('lng', -47, -46.1)]
    const photo = (name, n) => file(name, n, ['image/jpeg', 'image/png', 'image/webp'], 10485760)
    const glb = () => file('modelo_glb', 1, ['model/gltf-binary'], 52428800)
    const create = (name, fields, read, write, indexes = []) => {
      try {
        app.findCollectionByNameOrId(name)
        return
      } catch (_) {}
      app.save(
        new Collection({
          name,
          type: 'base',
          fields: fields.concat([
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ]),
          listRule: read,
          viewRule: read,
          createRule: write,
          updateRule: write,
          deleteRule: write,
          indexes,
        }),
      )
    }
    create(
      'sp3d_empreendimentos',
      [
        { ...text('slug', 80, true), min: 3, pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' },
        text('nome', 120, true),
        {
          name: 'status',
          type: 'select',
          values: ['lancamento', 'obras', 'futuro', 'entregue'],
          maxSelect: 1,
          required: true,
        },
        num('ano_entrega', 1800, 2100, true),
        text('endereco', 200, true),
        text('bairro', 80, true),
        ...coord(),
        num('area_min'),
        num('area_max'),
        num('dorms', 0, 10, true),
        num('suites', 0, 10, true),
        photo('fotos', 12),
        photo('capa', 1),
        glb(),
        num('altura_m', 0, 1000),
        num('rotacao_graus', 0, 360),
        { ...text('cor_destaque', 7), pattern: '^#[0-9a-fA-F]{6}$' },
        num('ordem', 0, 100000, true),
        { name: 'publicado', type: 'bool' },
      ],
      pub,
      admin,
      [
        'CREATE UNIQUE INDEX idx_sp3d_emp_slug ON sp3d_empreendimentos (slug)',
        'CREATE INDEX idx_sp3d_emp_status ON sp3d_empreendimentos (status, ano_entrega)',
      ],
    )
    create(
      'sp3d_pois',
      [
        text('nome', 120, true),
        {
          name: 'tipo',
          type: 'select',
          values: ['metro', 'trem', 'hospital', 'parque', 'escola', 'shopping'],
          maxSelect: 1,
          required: true,
        },
        ...coord(),
        text('linha', 60),
      ],
      '',
      admin,
    )
    const rel = (name, target, cascadeDelete = false) => ({
      name,
      type: 'relation',
      collectionId: app.findCollectionByNameOrId(target).id,
      maxSelect: 1,
      cascadeDelete,
    })
    create(
      'sp3d_distancias',
      [
        { ...rel('empreendimento', 'sp3d_empreendimentos', true), required: true },
        { ...rel('poi', 'sp3d_pois', true), required: true },
        num('metros'),
        num('minutos_a_pe'),
        { name: 'rota_validada', type: 'bool' },
        text('metodo', 20),
      ],
      'empreendimento.publicado = true || (' + admin + ')',
      null,
      ['CREATE UNIQUE INDEX idx_sp3d_dist_par ON sp3d_distancias (empreendimento, poi)'],
    )
    create(
      'sp3d_marcos',
      [text('nome', 120, true), ...coord(), glb(), { name: 'mostrar_rotulo', type: 'bool' }],
      '',
      admin,
    )
    create(
      'sp3d_config',
      [text('chave', 60, true), { name: 'dados', type: 'json', required: true, maxSize: 2000000 }],
      '',
      admin,
      ['CREATE UNIQUE INDEX idx_sp3d_config_chave ON sp3d_config (chave)'],
    )
    create(
      'sp3d_leads',
      [
        text('nome', 120, true),
        { ...text('telefone', 20, true), min: 10, pattern: '^[0-9+()\\- ]{10,20}$' },
        { name: 'email', type: 'email' },
        text('mensagem', 2000),
        rel('empreendimento', 'sp3d_empreendimentos'),
        {
          name: 'origem',
          type: 'select',
          values: ['formulario', 'whatsapp'],
          maxSelect: 1,
          required: true,
        },
        text('ip_hash', 64),
      ],
      admin,
      null,
      ['CREATE INDEX idx_sp3d_leads_emp ON sp3d_leads (empreendimento, created)'],
    )
    const leads = app.findCollectionByNameOrId('sp3d_leads')
    leads.deleteRule = admin
    app.save(leads)
    create(
      'sp3d_eventos',
      [
        {
          name: 'tipo',
          type: 'select',
          values: ['sessao', 'abriu_imovel', 'ver_calcada', 'lead'],
          maxSelect: 1,
          required: true,
        },
        rel('empreendimento', 'sp3d_empreendimentos'),
        text('dispositivo', 40),
        num('duracao_s', 0, 86400, true),
        text('ip_hash', 64),
      ],
      admin,
      null,
      ['CREATE INDEX idx_sp3d_ev_tipo ON sp3d_eventos (tipo, created)'],
    )
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
