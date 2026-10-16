migrate(
  (app) => {
    let existing = null
    try {
      existing = app.findFirstRecordByData('sp3d_config', 'chave', 'chegada_adapta')
    } catch (_) {}
    if (existing) return
    const row = new Record(app.findCollectionByNameOrId('sp3d_config'))
    row.set('chave', 'chegada_adapta')
    row.set('dados', {
      nome: 'Adapta',
      edificio: 'Berrini One',
      endereco:
        'Av. Engenheiro Luís Carlos Berrini, 105 - Cidade Monções, São Paulo - SP, 04571-010',
      entrada_confirmada: false,
      instrucao_entrada:
        'A portaria e as orientações de acesso do evento ainda precisam ser confirmadas. Consulte o convite do seu evento.',
      aviso:
        'O endereço está confirmado; a réplica 3D e a posição exata da entrada seguem em validação.',
      fontes: [
        {
          titulo: 'Berrini One — Pátria',
          url: 'https://realestate.patria.com/en/portfolio/berrini-one',
        },
        {
          titulo: 'Evento passado da Adapta — Sympla',
          url: 'https://www.sympla.com.br/evento/imersao-liderancas-e-receita-previsivel-com-a-adapta/3523083',
        },
      ],
    })
    app.save(row)
  },
  () => {},
)
