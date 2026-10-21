import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  loadArrival,
  directionsUrl,
  wazeUrl,
  MAPA_REGIAO,
  type ArrivalConfig,
} from '@/services/arrival'

export default function AdaptaArrival() {
  const [config, setConfig] = useState<ArrivalConfig | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [copyMessage, setCopyMessage] = useState('')
  const addressRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    let active = true
    setError('')
    loadArrival()
      .then((value) => {
        if (active) setConfig(value)
      })
      .catch(() => {
        if (active)
          setError(
            'Não foi possível carregar as orientações. Verifique sua conexão e tente novamente.',
          )
      })
    return () => {
      active = false
    }
  }, [attempt])
  async function copyAddress() {
    if (!config) return
    try {
      await navigator.clipboard.writeText(config.endereco)
      setCopyMessage('Endereço copiado.')
    } catch {
      addressRef.current?.focus()
      addressRef.current?.select()
      setCopyMessage('Endereço selecionado. Use a opção Copiar do seu dispositivo.')
    }
  }
  const button =
    'inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-600 px-5 py-3 text-sm font-medium hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300'
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-100 sm:py-16">
      <div className="mx-auto max-w-2xl space-y-7">
        <Link to="/" className="text-sm text-slate-400 underline">
          Guia Adapta · voltar ao início
        </Link>
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[.25em] text-amber-300">Seu destino no evento</p>
          <h1 className="text-4xl font-light sm:text-5xl">Nos vemos na Adapta.</h1>
          <p className="text-slate-400">
            Consulte o endereço e abra o trajeto no seu aplicativo de mapas.
          </p>
        </header>
        <Link to="/explorar" className={button}>
          Explorar entorno em 3D · preview técnico
        </Link>
        <p className="text-xs text-slate-400">
          Amostra de dados reais, sem validação externa de precisão. Não substitui as orientações de
          chegada.
        </p>
        {error ? (
          <section role="alert" className="space-y-4 rounded-xl border border-red-900 p-5">
            <p>{error}</p>
            <button className={button} onClick={() => setAttempt((value) => value + 1)}>
              Tentar novamente
            </button>
          </section>
        ) : !config ? (
          <p role="status">Carregando orientações…</p>
        ) : (
          <>
            <section className="space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-7">
              <h2 className="text-xl">
                {config.nome} · {config.edificio}
              </h2>
              <label htmlFor="arrival-address" className="text-sm text-slate-400">
                Endereço do destino
              </label>
              <textarea
                id="arrival-address"
                ref={addressRef}
                readOnly
                value={config.endereco}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-600 bg-slate-950 p-3 text-base leading-relaxed"
              />
              <button className={button} onClick={copyAddress}>
                Copiar endereço
              </button>
              <p role="status" aria-live="polite" className="text-sm text-amber-200">
                {copyMessage}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  className={button}
                  href={directionsUrl(config.endereco, 'walking')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Maps · a pé ↗
                </a>
                <a
                  className={button}
                  href={directionsUrl(config.endereco, 'driving')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Maps · de carro ↗
                </a>
              </div>
              <a
                className={`${button} w-full`}
                href={wazeUrl(config.endereco)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir endereço no Waze ↗
              </a>
              <p className="text-xs leading-relaxed text-slate-400">
                O Waze abre uma busca pelo endereço: confira o destino e inicie a navegação no
                aplicativo. Google Maps e Waze definem a origem e o trajeto. Este site não solicita
                nem armazena sua localização. A indicação no mapa não confirma a portaria de entrada
                do evento.
              </p>
            </section>
            <section className="space-y-3 rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-7">
              <h2 className="text-xl">A região</h2>
              <p className="text-sm text-slate-400">
                Localização do edifício no mapa da região (Berrini / Vila Olímpia).
              </p>
              <iframe
                title="Mapa da região do evento · OpenStreetMap"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${MAPA_REGIAO.bbox}&layer=mapnik&marker=${MAPA_REGIAO.lat},${MAPA_REGIAO.lng}`}
                loading="lazy"
                className="h-72 w-full rounded-lg border border-slate-700 sm:h-80"
              />
              <p className="text-xs leading-relaxed text-slate-400">
                Mapa © OpenStreetMap contributors (ODbL). O marcador indica o edifício, não a
                portaria de entrada do evento.
              </p>
              <a
                className={button}
                href={`https://www.openstreetmap.org/?mlat=${MAPA_REGIAO.lat}&mlon=${MAPA_REGIAO.lng}#map=17/${MAPA_REGIAO.lat}/${MAPA_REGIAO.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir mapa em tela cheia ↗
              </a>
            </section>
            <aside className="space-y-2 rounded-xl border border-amber-700/50 p-5">
              <h2 className="font-medium text-amber-200">
                {config.entrada_confirmada
                  ? 'Orientações de acesso'
                  : 'Entrada do evento a confirmar'}
              </h2>
              <p className="text-sm leading-relaxed text-slate-300">{config.instrucao_entrada}</p>
            </aside>
            <footer className="space-y-2 text-xs leading-relaxed text-slate-400">
              <p>{config.aviso}</p>
              <p>
                Endereço do edifício:{' '}
                <a
                  className="underline"
                  href="https://realestate.patria.com/en/portfolio/berrini-one"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Berrini One · Pátria
                </a>
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  )
}
