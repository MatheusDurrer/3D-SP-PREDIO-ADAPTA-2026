import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const SPACES = [
  {
    id: 'recepcao',
    name: 'Recepção Adapta',
    source: 'Foto P07 · material enviado pela organização',
    image: '/interior/recepcao.webp',
    alt: 'Recepção com balcão ripado de aparência amadeirada, marca Adapta e parede escura.',
    description:
      'A identidade da Adapta aparece no balcão iluminado e no contraste entre o painel escuro e os tons amadeirados.',
    details: [
      'Balcão ripado e tampo escuro',
      'Letreiro Adapta no frontal',
      'Piso claro, plantas e assentos na área de espera',
    ],
    limit:
      'A foto não define a planta completa da recepção nem indica o procedimento de credenciamento do evento.',
  },
  {
    id: 'apresentacao',
    name: 'Área de apresentação',
    source: 'Foto P30 · material enviado pela organização',
    image: '/interior/apresentacao.webp',
    alt: 'Área de apresentação com plataforma escura, púlpito Adapta e circulação próxima a divisórias envidraçadas.',
    description:
      'Um ponto de reconhecimento do espaço de eventos: plataforma e púlpito com a marca, junto à circulação interna.',
    details: [
      'Plataforma escura e púlpito Adapta',
      'Transição entre pisos de aparência amadeirada e carpete',
      'Divisórias envidraçadas e forro modular',
    ],
    limit:
      'O enquadramento não mostra toda a sala. Capacidade, medidas e configuração do evento não foram confirmadas.',
  },
  {
    id: 'copa',
    name: 'Copa e apoio',
    source: 'Foto P34 · material enviado pela organização',
    image: '/interior/copa.webp',
    alt: 'Área de apoio com armários escuros, bancada, painel ripado, plantas e objetos decorativos.',
    description:
      'A área de apoio combina armários escuros e uma bancada com vegetação e objetos decorativos.',
    details: [
      'Armários e bancada escuros',
      'Painel ripado de aparência amadeirada',
      'Plantas e objetos de apoio',
    ],
    limit:
      'Disponibilidade de serviços, acesso e operação da copa no dia do evento dependem da organização.',
  },
] as const

type PhotoProps = { src: string; alt: string; large?: boolean }
function ReferencePhoto({ src, alt, large = false }: PhotoProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3">
      {state === 'loading' && (
        <p role="status" className="text-slate-300 p-4">
          Carregando fotografia…
        </p>
      )}
      {state !== 'error' && (
        <img
          src={`${src}${attempt ? `?retry=${attempt}` : ''}`}
          alt={alt}
          onLoad={() => setState('ready')}
          onError={() => setState('error')}
          className={`mx-auto w-full object-contain ${large ? 'max-h-[70dvh]' : 'max-h-[58dvh]'}`}
          style={{ display: state === 'ready' ? 'block' : 'none' }}
        />
      )}
      {state === 'error' && (
        <div role="alert" className="space-y-3 p-4">
          <p>Não foi possível carregar a fotografia.</p>
          <button
            type="button"
            className="brand-link"
            onClick={() => {
              setState('loading')
              setAttempt((value) => value + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}

export default function InteriorGuide() {
  const [params, setParams] = useSearchParams()
  const selected = SPACES.find((item) => item.id === params.get('ambiente')) ?? SPACES[0]
  const [enlarged, setEnlarged] = useState(false)
  const close = useRef<HTMLButtonElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    setEnlarged(false)
  }, [selected.id])
  useEffect(() => {
    if (!enlarged) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    close.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEnlarged(false)
      if (event.key === 'Tab') {
        const dialog = document.getElementById('interior-photo-dialog')
        const buttons = dialog?.querySelectorAll<HTMLButtonElement>('button')
        if (!buttons?.length) return
        const first = buttons[0],
          last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      opener.current?.focus()
    }
  }, [enlarged])
  const index = SPACES.findIndex((item) => item.id === selected.id)
  const change = (id: string) => {
    setEnlarged(false)
    setParams({ ambiente: id })
  }
  return (
    <main className="brand-page">
      <div className="brand-wrap space-y-7">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" aria-label="Adapta · início">
            <img src="/brand/adapta-logo.svg" alt="Adapta" className="brand-logo" />
          </Link>
          <Link to="/adapta" className="brand-link">
            Como chegar
          </Link>
        </header>
        <section className="space-y-3 max-w-3xl">
          <p className="text-sm uppercase tracking-widest text-slate-300">
            Conheça antes de chegar
          </p>
          <h1 className="text-4xl font-semibold">Por dentro da Adapta</h1>
          <p className="text-slate-300 leading-relaxed">
            Referências fotográficas reais do escritório e do espaço de eventos no 32º andar,
            conforme informado pela organização. Escolha um ambiente para reconhecer seus elementos.
          </p>
          <p className="text-sm text-slate-300">
            Guia visual em preparação. Não é um tour 360°, uma planta medida nem uma rota interna
            confirmada. A ordem das fotos não representa o caminho entre os ambientes.
          </p>
        </section>
        <nav className="flex flex-wrap gap-3" aria-label="Escolher ambiente">
          {SPACES.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={selected.id === item.id}
              onClick={() => change(item.id)}
              className={`brand-link ${selected.id === item.id ? 'brand-install' : ''}`}
            >
              {item.name}
            </button>
          ))}
        </nav>
        <section className="grid gap-6 md:grid-cols-2 items-start" aria-labelledby="interior-title">
          <div className="space-y-3">
            <ReferencePhoto key={selected.id} src={selected.image} alt={selected.alt} />
            <button
              ref={opener}
              type="button"
              className="brand-link"
              onClick={() => setEnlarged(true)}
            >
              Ampliar fotografia
            </button>
            <p className="text-xs text-slate-300">
              {selected.source}. Imagem otimizada para carregamento; detalhes finos exigem consulta
              ao original.
            </p>
          </div>
          <div className="brand-card space-y-4">
            <h2 id="interior-title" className="text-2xl font-semibold">
              {selected.name}
            </h2>
            <p className="leading-relaxed">{selected.description}</p>
            <h3 className="font-semibold">O que reconhecer</h3>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              {selected.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <p className="text-sm text-slate-300 border-t border-slate-700 pt-4">
              {selected.limit}
            </p>
          </div>
        </section>
        <nav aria-label="Navegar pelas referências" className="flex flex-wrap gap-3">
          <button
            type="button"
            className="brand-link disabled:opacity-40"
            disabled={index === 0}
            onClick={() => change(SPACES[index - 1].id)}
          >
            Foto anterior
          </button>
          <button
            type="button"
            className="brand-link disabled:opacity-40"
            disabled={index === SPACES.length - 1}
            onClick={() => change(SPACES[index + 1].id)}
          >
            Próxima foto
          </button>
          <Link to="/explorar" className="brand-link">
            Ver modelo externo 3D
          </Link>
        </nav>
        <footer className="text-sm text-slate-300 border-t border-slate-700 pt-5">
          Fotos fornecidas pela organização. O material retrata uma configuração do espaço, que pode
          mudar conforme o evento. Não há reconhecimento de pessoas, exibição de códigos de acesso
          ou informação de credenciamento neste guia.
        </footer>
        {enlarged && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/95 p-4 overflow-y-auto"
            onClick={(event) => {
              if (event.target === event.currentTarget) setEnlarged(false)
            }}
          >
            <section
              id="interior-photo-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="interior-photo-title"
              className="max-w-4xl mx-auto space-y-4"
            >
              <header className="flex items-center justify-between gap-3">
                <h2 id="interior-photo-title" className="text-xl">
                  {selected.name}
                </h2>
                <button
                  ref={close}
                  type="button"
                  className="brand-link"
                  onClick={() => setEnlarged(false)}
                >
                  Fechar fotografia
                </button>
              </header>
              <ReferencePhoto
                key={`large-${selected.id}`}
                src={selected.image}
                alt={selected.alt}
                large
              />
              <p className="text-sm text-slate-300">Pressione Esc ou use Fechar para voltar.</p>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
