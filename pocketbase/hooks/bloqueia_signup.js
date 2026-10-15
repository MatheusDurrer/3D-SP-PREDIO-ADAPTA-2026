// bloqueia_signup.js — onRecordCreateRequest em users (defesa em profundidade).
//
// A RLS da 0001 já fecha o signup (createRule null = só superuser). Este hook
// intercepta o request HTTP e rejeita criação pública com 403, caso a regra
// seja afrouxada por engano no futuro. Nada de bare return (guia §3.3): ou
// throw, ou return e.next().
onRecordCreateRequest((e) => {
  if (e.hasSuperuserAuth()) {
    return e.next() // painel/plataforma: sempre passa
  }
  throw new ForbiddenError('Cadastro público desativado. Contas são criadas pela operação.')
}, 'users')
