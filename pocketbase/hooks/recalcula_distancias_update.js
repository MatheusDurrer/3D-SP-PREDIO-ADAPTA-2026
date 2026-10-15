// recalcula_distancias_update.js — onRecordAfterUpdateSuccess em sp3d_empreendimentos.
// Par do recalcula_distancias.js (create): 1 hook por arquivo, lógica inline duplicada
// de propósito (callbacks rodam em VM separada e não veem declarações top-level).
//
// Mesmo contrato do create: metros = linha reta (haversine), metodo='linha_reta',
// rota_validada=false. NUNCA grava minutos_a_pe — só o pipeline de dados (rota real da
// rede viária) grava esse campo, com metodo='rota_real' + rota_validada=true. A UI só
// trata minutos_a_pe como medido quando rota_validada=true; 0 nunca significa "medido".
onRecordAfterUpdateSuccess((e) => {
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
