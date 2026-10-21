import { useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { getInstallState, subscribeInstall, requestInstall } from '@/lib/installTracking'

export default function InstallApp() {
  const install = useSyncExternalStore(subscribeInstall, getInstallState)
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
            Use o guia como aplicativo no celular ou computador. É um app web: não exige download
            pela App Store ou Google Play. A instalação e a confirmação dependem do seu navegador.
          </p>
        </section>
        <section className="brand-card space-y-4 max-w-2xl" aria-labelledby="install-status-title">
          <h2 id="install-status-title" className="text-2xl font-semibold">
            {install.standalone ? 'Você já está no app' : 'Instalação neste navegador'}
          </h2>
          <p role="status" aria-live="polite" className="text-slate-300 leading-relaxed">
            {install.standalone
              ? 'O guia está aberto em modo aplicativo. Continue para as orientações de chegada ou explore a região.'
              : install.message ||
                (install.available
                  ? 'Seu navegador disponibilizou a instalação direta. Toque no botão e confirme na janela que será aberta.'
                  : 'O convite direto ainda não está disponível neste navegador. Isso não confirma se o app já está instalado. Escolha abaixo as instruções do seu sistema e navegador.')}
          </p>
          {(install.available || install.busy) && !install.standalone && (
            <button
              type="button"
              className="brand-link brand-install disabled:opacity-60"
              disabled={install.busy}
              onClick={() => {
                void requestInstall()
              }}
            >
              {install.busy ? 'Aguardando navegador…' : 'Instalar neste dispositivo'}
            </button>
          )}
        </section>
        <nav aria-label="Escolher instruções de instalação" className="flex flex-wrap gap-3">
          <a href="#install-mac-safari" className="brand-link">
            MacBook · Safari
          </a>
          <a href="#install-desktop-chrome" className="brand-link">
            Computador · Chrome
          </a>
          <a href="#install-firefox" className="brand-link">
            Firefox
          </a>
          <a href="#install-ios" className="brand-link">
            iPhone / iPad
          </a>
          <a href="#install-android" className="brand-link">
            Android · Chrome
          </a>
        </nav>
        <div className="grid gap-5 md:grid-cols-2">
          <section
            id="install-mac-safari"
            className="brand-card space-y-5 scroll-mt-6"
            aria-labelledby="mac-safari-title"
          >
            <p className="text-sm tracking-widest uppercase text-slate-300">
              MacBook / Mac · Safari
            </p>
            <h2 id="mac-safari-title" className="text-2xl font-semibold">
              Adicionar ao Dock
            </h2>
            <p className="text-slate-300">
              Requer macOS Sonoma 14 ou posterior. No Safari, esta etapa é feita pelo menu do
              navegador — o botão do site não consegue abrir a instalação.
            </p>
            <ol className="list-decimal pl-5 space-y-4 leading-relaxed">
              <li>
                Abra a{' '}
                <Link className="underline" to="/">
                  página inicial do Guia Adapta
                </Link>{' '}
                no <strong>Safari</strong>, para que o app comece no início do guia.
              </li>
              <li>
                Na barra de menus do Mac, escolha <strong>Arquivo → Adicionar ao Dock</strong>.
                Também pode usar <strong>Compartilhar → Adicionar ao Dock</strong>.
              </li>
              <li>
                Confira o nome <strong>Guia Adapta</strong> e confirme em <strong>Adicionar</strong>
                .
              </li>
              <li>
                Abra o guia pelo <strong>Dock</strong>, pelo <strong>Spotlight</strong> ou pela
                pasta Aplicativos da sua pasta pessoal.
              </li>
            </ol>
            <p className="text-sm text-slate-300">
              Se a opção não aparecer, confira a versão do macOS ou instale pelo Chrome. Não é
              necessário permitir notificações para instalar.
            </p>
            <a
              className="underline"
              href="https://support.apple.com/en-us/104996"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instruções oficiais da Apple para Mac
            </a>
          </section>
          <section
            id="install-desktop-chrome"
            className="brand-card space-y-5 scroll-mt-6"
            aria-labelledby="desktop-chrome-title"
          >
            <p className="text-sm tracking-widest uppercase text-slate-300">
              MacBook / Mac / Windows · Chrome
            </p>
            <h2 id="desktop-chrome-title" className="text-2xl font-semibold">
              Instalar pelo Google Chrome
            </h2>
            <ol className="list-decimal pl-5 space-y-4 leading-relaxed">
              <li>
                Abra o guia no <strong>Google Chrome</strong>.
              </li>
              <li>
                Se o botão <strong>Instalar neste dispositivo</strong> estiver disponível acima,
                clique nele e confirme na janela do navegador.
              </li>
              <li>
                Como alternativa, use o ícone de instalação na barra de endereço ou o menu{' '}
                <strong>⋮ → Transmitir, salvar e compartilhar → Instalar página como app</strong>.
                Os nomes podem variar com a versão.
              </li>
              <li>Confirme a instalação e abra o guia pelo atalho criado pelo navegador.</li>
            </ol>
            <p className="text-sm text-slate-300">
              Se o convite não aparecer, isso não significa que o app esteja instalado. Verifique o
              menu do Chrome ou continue no navegador.
            </p>
            <a
              className="underline"
              href="https://support.google.com/chrome/answer/9658361?hl=pt-BR&amp;co=GENIE.Platform%3DDesktop"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instruções oficiais do Chrome para computador
            </a>
          </section>
          <section
            id="install-firefox"
            className="brand-card space-y-5 scroll-mt-6"
            aria-labelledby="firefox-title"
          >
            <p className="text-sm tracking-widest uppercase text-slate-300">Mozilla Firefox</p>
            <h2 id="firefox-title" className="text-2xl font-semibold">
              Instalação conforme o sistema
            </h2>
            <p className="leading-relaxed">
              <strong>No Windows:</strong> em versões compatíveis, clique no botão de apps da Web na
              barra de endereço do próprio Firefox. Ele cria o aplicativo e um atalho no menu
              Iniciar. O botão deste site não pode abrir esse comando do Firefox.
            </p>
            <p className="text-slate-300">
              A Mozilla documenta esse recurso no Firefox 143 ou posterior; para instalações pela
              Microsoft Store, no Firefox 150 ou posterior. A disponibilidade depende da versão e da
              distribuição.
            </p>
            <p className="leading-relaxed">
              <strong>No Mac:</strong> a Mozilla não oferece esse mesmo recurso documentado para
              Windows. Para instalar o Guia Adapta, abra o endereço no Safari ou Chrome e siga as
              instruções correspondentes. Você pode continuar usando o guia normalmente no Firefox.
            </p>
            <a href="#install-mac-safari" className="brand-link">
              Ver como instalar no Mac
            </a>
            <p>
              <a
                className="underline"
                href="https://support.mozilla.org/en-US/kb/web-apps-firefox-windows"
                target="_blank"
                rel="noopener noreferrer"
              >
                Compatibilidade oficial do Firefox
              </a>
            </p>
          </section>
          <section className="brand-card space-y-5 scroll-mt-6" aria-labelledby="install-ios">
            <p className="text-sm tracking-widest uppercase text-slate-300">
              iPhone / iPad · Safari
            </p>
            <h2 id="install-ios" className="text-2xl font-semibold scroll-mt-6">
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
            <h2 id="install-android" className="text-2xl font-semibold scroll-mt-6">
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
