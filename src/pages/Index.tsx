import { Link } from 'react-router-dom'

const Index = () => (
  <main className="min-h-screen bg-slate-950 text-slate-200 px-6 py-16 flex items-center justify-center">
    <section className="max-w-3xl space-y-7" aria-labelledby="project-title">
      <img src="/brand/adapta-logo.svg" alt="Adapta" className="brand-logo" />
      <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
        Adapta · guia do participante
      </p>
      <h1 id="project-title" className="text-4xl font-light leading-tight">
        Sua imersão começa na Adapta.
      </h1>
      <p className="text-slate-400 leading-relaxed">
        Encontre o endereço do evento, veja o mapa da região e abra o destino no Google Maps ou no
        Waze. O preview 3D ajuda você a conhecer o entorno e os bairros vizinhos antes de chegar.
      </p>
      <nav aria-label="Explorar o projeto" className="flex flex-wrap gap-3">
        <Link
          to="/adapta"
          className="inline-flex min-h-12 items-center rounded-xl bg-slate-600 px-5 py-3 font-medium text-white"
        >
          Como chegar à Adapta
        </Link>
        <Link
          to="/explorar"
          className="inline-flex min-h-12 items-center rounded-xl border border-slate-600 px-5 py-3"
        >
          Explorar modelo 3D
        </Link>

        <Link to="/instalar" className="brand-link brand-install">
          Instalar aplicativo ↗
        </Link>
      </nav>

      <aside className="border border-slate-700 rounded-xl p-5 text-sm leading-relaxed">
        <h2 className="text-slate-100 font-medium mb-2">Explore antes de chegar</h2>
        <p>
          O preview mostra uma amostra histórica do entorno, não um mapa atual concluído. O tour
          360° do escritório será integrado a partir do material produzido pela organização. Os
          restaurantes para almoço serão destacados após a seleção da organização.
        </p>
      </aside>
      <p className="text-xs text-slate-500">
        Preview em construção. Dados históricos de 2020 não comprovam a forma atual dos prédios.
        Para dirigir, utilize os aplicativos de navegação; confira as orientações de acesso do
        evento.
      </p>
      <footer className="text-xs text-slate-400 border-t border-slate-800 pt-5 space-y-2">
        <p>Fontes do mapa — uso e licenças em validação:</p>
        <p>
          <a
            className="underline underline-offset-4"
            href="https://geosampa.prefeitura.sp.gov.br/"
            target="_blank"
            rel="noreferrer"
          >
            Prefeitura de São Paulo / GeoSampa
          </a>{' '}
          ·{' '}
          <a
            className="underline underline-offset-4"
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            © OpenStreetMap contributors · ODbL
          </a>
        </p>
      </footer>
    </section>
  </main>
)
export default Index
