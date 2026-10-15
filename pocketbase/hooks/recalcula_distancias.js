// recalcula_distancias.js — onRecordAfterCreateSuccess em sp3d_empreendimentos.
// (REGRA 1 HOOK/ARQUIVO: create neste arquivo; update em recalcula_distancias_update.js.
//  A lógica está 100% inline e duplicada de propósito — callbacks rodam em VM separada
//  do pool e NÃO veem declarações top-level.)
//
// O QUE FAZ: ao CRIAR um empreendimento, refaz o par empreendimento↔POI com todos os
// POIs de metro/trem/hospital/parque, gravando em sp3d_distancias:
//   metros        = distância em LINHA RETA (haversine) — rotulada como tal
//   metodo        = 'linha_reta'
//   rota_validada = false
// O QUE NÃO FAZ (contrato anti-dado-fictício): NUNCA grava minutos_a_pe. "Minutos a pé"
// só é verdade com rota real da rede viária (pipeline de dados). O campo existe no schema
// (0002) e fica NULL até o pipeline gravar com metodo='rota_real' + rota_validada=true.
// A UI só trata minutos_a_pe como medido quando rota_validada=true — zero (0) nunca
// significa "medido".
//
// After*Success (não pre-commit): varre POIs (I/O denso) e o guia manda trabalho pesado
// para after-success; e.next() no finally em TODOS os caminhos. $app (não app).
onRecordAfterCreateSuccess((e) => {
  try {
    const emp = e.record
    const lat1 = emp.getFloat('lat')
    const lng1 = emp.getFloat('lng')
    const rad = Math.PI / 180

    const tipos = ['metro', 'trem', 'hospital', 'parque']
    for (let t = 0; t < tipos.length; t++) {
      const pois = $app.findRecordsByFilter('sp3d_pois', 'tipo = "' + tipos[t] + '"', '', 500, 0)
      for (let i = 0; i < pois.length; i++) {
        const poi = pois[i]
        const dLat = (poi.getFloat('lat') - lat1) * rad
        const dLng = (poi.getFloat('lng') - lng1) * rad
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * rad) *
            Math.cos(poi.getFloat('lat') * rad) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2)
        const metros = Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))

        const filtro = 'empreendimento = "' + emp.id + '" && poi = "' + poi.id + '"'
        const existentes = $app.findRecordsByFilter('sp3d_distancias', filtro, '', 1, 0)
        let rec
        if (existentes.length > 0) {
          rec = existentes[0]
        } else {
          rec = new Record($app.findCollectionByNameOrId('sp3d_distancias'))
          rec.set('empreendimento', emp.id)
          rec.set('poi', poi.id)
        }
        rec.set('metros', metros)
        rec.set('metodo', 'linha_reta')
        rec.set('rota_validada', false)
        $app.save(rec)
      }
    }
  } finally {
    e.next()
  }
}, 'sp3d_empreendimentos')
