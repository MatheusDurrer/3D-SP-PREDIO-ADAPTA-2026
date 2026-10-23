// Temporary owner-authorized QA provisioning. Remove before production publication.
routerAdd('POST', '/backend/v1/qa-session-20261023/{action}', (e) => {
  const key = $secrets.get('SP3D_QA_TEMP_20261023')
  if (!key || key.length < 32 || e.request.header.get('X-QA-Key') !== key)
    return e.json(403, { message: 'Forbidden' })
  const action = e.request.pathValue('action')
  const email = 'qa.20261023@sp3d.invalid'
  if (action === 'create') {
    let found = null
    try {
      found = $app.findAuthRecordByEmail('users', email)
    } catch (_) {}
    if (found) return e.json(409, { message: 'QA account already exists' })
    const rec = new Record($app.findCollectionByNameOrId('users'))
    rec.setEmail(email)
    rec.setPassword(key)
    rec.setVerified(true)
    rec.set('name', 'QA temporario autorizado 20261023')
    rec.set('papel', 'admin')
    $app.save(rec)
    return e.json(201, { id: rec.id, created: true })
  }
  if (action === 'cleanup') {
    let rec = null
    try {
      rec = $app.findAuthRecordByEmail('users', email)
    } catch (_) {}
    if (!rec) return e.json(200, { removed: true, absent: true })
    if (rec.get('name') !== 'QA temporario autorizado 20261023')
      return e.json(409, { message: 'QA identity mismatch' })
    $app.delete(rec)
    return e.json(200, { removed: true })
  }
  if (action === 'status') {
    let rec = null
    try {
      rec = $app.findAuthRecordByEmail('users', email)
    } catch (_) {}
    return e.json(200, { exists: !!rec })
  }
  return e.json(400, { message: 'Invalid action' })
})
