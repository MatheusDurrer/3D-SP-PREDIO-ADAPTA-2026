import { Link } from 'react-router-dom'

export default function InstallApp() {
  return (
    <main className="brand-page">
      <div className="brand-wrap space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-5">
          <Link to="/" aria-label="Adapta · início">
            <img src="/brand/adapta-logo.svg" alt="Adapta" className="brand-logo" />
          </Link>
          <Link className="brand-link" to="/">
            Voltar ao início
          </Link>
        </header>
        <section className="max-w-2xl space-y-4">
          <p className="text-sm uppercase tracking-widest text-slate-300">O guia sempre com você</p>
          <h1 className="text-4xl sm:text-5xl font-semibold">Instale o guia da Adapta</h1>
          <p className="text-slate-300 leading-relaxed">
            Adicione este site à tela inicial do seu celular. É um aplicativo web: não exige
            download pela App Store ou Google Play.
          </p>
        </section>
        <div className="grid gap-5 md:grid-cols-2">
          <section className="brand-card space-y-5" aria-labelledby="install-ios">
            <p className="text-sm tracking-widest uppercase text-slate-300">iPhone · iOS</p>
            <h2 id="install-ios" className="text-2xl font-semibold">
              Adicionar pelo Safari
            </h2>
            <ol className="list-decimal pl-5 space-y-4 leading-relaxed">
              <li>
                Abra este endereço no <strong>Safari</strong>. Se estiver dentro do WhatsApp ou
                Instagram, use a opção de abrir no navegador.
              </li>
              <li>
                Abra o menu <strong>Compartilhar</strong> do Safari.
              </li>
              <li>
                Escolha <strong>Adicionar à Tela de Início</strong>. Se a opção não aparecer,
                procure nas ações do menu.
              </li>
              <li>
                Quando disponível, mantenha <strong>Abrir como App</strong> ativado e toque em{' '}
                <strong>Adicionar</strong>.
              </li>
            </ol>
          </section>
          <section className="brand-card space-y-5" aria-labelledby="install-android">
            <p className="text-sm tracking-widest uppercase text-slate-300">Celular · Android</p>
            <h2 id="install-android" className="text-2xl font-semibold">
              Adicionar pelo Chrome
            </h2>
            <ol className="list-decimal pl-5 space-y-4 leading-relaxed">
              <li>
                Abra este endereço no <strong>Google Chrome</strong>, fora do navegador interno de
                outros aplicativos.
              </li>
              <li>
                Toque no menu de <strong>três pontos</strong> do navegador.
              </li>
              <li>
                Escolha <strong>Instalar e criar atalho → Instalar</strong>. Em outras versões, a
                opção pode aparecer como <strong>Instalar app</strong> ou{' '}
                <strong>Adicionar à tela inicial</strong>.
              </li>
              <li>
                Confirme a instalação. O ícone ficará disponível na tela inicial ou na lista de
                aplicativos.
              </li>
            </ol>
          </section>
        </div>
        <aside className="brand-card space-y-3 max-w-2xl">
          <h2 className="text-xl font-semibold">Não encontrou a opção?</h2>
          <p className="text-slate-300 leading-relaxed">
            Os nomes e a posição dos menus variam conforme a versão do sistema. O app pode já estar
            instalado. Use um navegador atualizado ou continue acessando o guia normalmente pelo
            endereço.
          </p>
          <p className="text-sm text-slate-300">
            O mapa e os aplicativos de navegação precisam de conexão. Instalar não torna o conteúdo
            disponível offline.
          </p>
        </aside>
        <p className="text-xs text-slate-300">
          Orientações baseadas no suporte oficial da{' '}
          <a
            className="underline"
            href="https://support.apple.com/guide/iphone/turn-a-website-into-an-app-iph42ab2f3a7/ios"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apple
          </a>{' '}
          e do{' '}
          <a
            className="underline"
            href="https://support.google.com/chrome/answer/9658361?hl=pt-BR&amp;co=GENIE.Platform%3DAndroid"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Chrome
          </a>
          .
        </p>
        <nav className="flex flex-wrap gap-3" aria-label="Continuar no guia">
          <Link to="/adapta" className="brand-link">
            Como chegar à Adapta
          </Link>
          <Link to="/explorar" className="brand-link">
            Explorar modelo 3D
          </Link>
        </nav>
      </div>
    </main>
  )
}
