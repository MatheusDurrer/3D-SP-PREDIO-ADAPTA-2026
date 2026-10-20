// Only explicitly public configuration keys may be read without admin auth.
// No records are created, modified or removed by this migration.
migrate(
  (app) => {
    const config = app.findCollectionByNameOrId('sp3d_config')
    const readRule =
      "chave = 'principal' || chave = 'chegada_adapta' || (@request.auth.id != '' && @request.auth.papel = 'admin')"
    config.listRule = readRule
    config.viewRule = readRule
    app.save(config)
  },
  (app) => {
    // Security-preserving rollback: never reopen arbitrary configuration keys.
    const config = app.findCollectionByNameOrId('sp3d_config')
    const readRule =
      "chave = 'principal' || chave = 'chegada_adapta' || (@request.auth.id != '' && @request.auth.papel = 'admin')"
    config.listRule = readRule
    config.viewRule = readRule
    app.save(config)
  },
)
