// 0004_sp3d_admin_user.js — usuário admin da demo (usuário do APP, papel='admin'),
// idempotente. NÃO é superuser: superuser é gerenciado pelo painel Skip e nunca
// nasce de migration. Este admin autentica pela API do app e tem só o que as
// regras da 0002 dão ao papel 'admin'.
//
// REGRAS:
// - NENHUMA conta do Tony (matheus.sotto@adapta.org) — e-mail de demo.
// - Senha NUNCA embutida: vem do secret SP3D_ADMIN_PASSWORD (configurado no
//   painel Skip Cloud ANTES do apply). Sem o secret, a migration FALHA com
//   mensagem clara — de propósito: admin ausente em silêncio é armadilha pior
//   (migration aplicada é imutável; não haveria segunda chance).
// - papel = 'admin' (único valor do select), verified, sem emailVisibility.
// - Signup público está FECHADO (createRule null na 0002): usuários nascem
//   só por migration/superuser — este é o caminho legítimo.
migrate(
  (app) => {
    try {
      app.findAuthRecordByEmail('users', 'admin@sp3d.demo')
      return // já existe: no-op idempotente
    } catch (_) {}

    const senha = $secrets.get('SP3D_ADMIN_PASSWORD')
    if (!senha || senha.length < 8) {
      throw new Error(
        'SP3D_ADMIN_PASSWORD ausente ou curta (<8). Configure o secret no painel Skip Cloud e reaplique.',
      )
    }

    const users = app.findCollectionByNameOrId('users')
    const rec = new Record(users)
    rec.setEmail('admin@sp3d.demo')
    rec.setPassword(senha) // hasheia; set() NÃO hasheia
    rec.setVerified(true)
    rec.set('name', 'Admin SP3D')
    rec.set('papel', 'admin')
    app.save(rec)
  },
  (app) => {
    try {
      app.delete(app.findAuthRecordByEmail('users', 'admin@sp3d.demo'))
    } catch (_) {}
  },
)
