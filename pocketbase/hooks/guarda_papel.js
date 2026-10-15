// guarda_papel.js — onRecordUpdateRequest em users (defesa em profundidade).
//
// A RLS da 0001 já trava: updateRule exige @request.body.papel:changed = false.
// Este hook é a segunda camada: intercepta o request HTTP e rejeita qualquer
// tentativa de mudar 'papel' na própria conta (ou em qualquer outra, pois a
// view/list já restringe a si mesmo). Se um dia a regra da collection for
// afrouxada por engano, o hook continua bloqueando.
//
// Superuser passa SEMPRE primeiro (guia §7: nunca trancar a plataforma).
onRecordUpdateRequest((e) => {
  if (e.hasSuperuserAuth()) {
    return e.next()
  }

  const info = e.requestInfo()
  const body = info && info.body ? info.body : {}
  const papelEnviado = body['papel']

  // Campo presente no body e com valor diferente do atual = tentativa de
  // alteração (reenviar o mesmo valor é permitido pela regra :changed).
  if (
    papelEnviado !== undefined &&
    papelEnviado !== null &&
    papelEnviado !== e.record.getString('papel')
  ) {
    throw new ForbiddenError('papel não pode ser alterado via API.')
  }

  return e.next()
}, 'users')
