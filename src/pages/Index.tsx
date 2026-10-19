import { Link } from 'react-router-dom'

const Index = () => (
  <main className="min-h-screen bg-slate-950 text-slate-200 px-6 py-16 flex items-center justify-center">
    <section className="max-w-xl space-y-6" aria-labelledby="project-title">
      <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
        São Paulo 3D · Validação de dados
      </p>
      <h1 id="project-title" className="text-4xl font-light leading-tight">
        Uma cidade real começa com dados reais.
      </h1>
      <p className="text-slate-400 leading-relaxed">
        O explorador técnico do entorno da Adapta já está disponível em preview, com uma amostra dos
        dados LiDAR e terreno medidos. A precisão externa não foi validada; esta visualização não
        representa a cidade inteira nem uma réplica visual concluída.
      </p>
      <nav aria-label="Explorar o projeto" className="flex flex-wrap gap-3">
        <Link
          to="/explorar"
          className="inline-flex min-h-12 items-center rounded-xl bg-amber-300 px-5 py-3 font-medium text-slate-950"
        >
          Abrir explorador 3D
        </Link>
        <Link
          to="/adapta"
          className="inline-flex min-h-12 items-center rounded-xl border border-slate-600 px-5 py-3"
        >
          Como chegar à Adapta
        </Link>
      </nav>
      <aside className="border border-slate-700 rounded-xl p-5 text-sm leading-relaxed">
        <h2 className="text-slate-100 font-medium mb-2">Piloto do eixo sudoeste</h2>
        <p>
          Pinheiros, Jardins, Itaim, Vila Olímpia, Moema e Ibirapuera. Nenhuma cobertura, precisão
          ou performance foi aprovada nesta etapa.
        </p>
      </aside>
      <p className="text-xs text-slate-500">
        Projeto técnico em construção. Não é uma demonstração da cidade concluída.
      </p>
      <footer className="text-xs text-slate-400 border-t border-slate-800 pt-5 space-y-2">
        <p>Fontes previstas no PRD — uso e licenças em validação:</p>
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
