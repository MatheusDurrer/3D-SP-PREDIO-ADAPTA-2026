import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadPublished } from '@/services/publicInventory'
import {
  STATUS_LABEL,
  STATUS_OPTIONS,
  isEmpreendimentoStatus,
  type Empreendimento,
} from '@/types/empreendimento'

export default function PublicInventory() {
  const [items, setItems] = useState<Empreendimento[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('todos')
  useEffect(() => {
    const ctrl = new AbortController()
    let alive = true
    setLoading(true)
    setError(false)
    loadPublished(page, ctrl.signal)
      .then((result) => {
        if (!alive) return
        setItems(result.items)
        setPages(result.totalPages)
        setTotal(result.totalItems)
      })
      .catch(() => {
        if (alive) setError(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
      ctrl.abort()
    }
  }, [page, attempt])
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return items.filter(
      (item) =>
        (status === 'todos' || item.status === status) &&
        (!q ||
          [item.nome, item.bairro, item.endereco].some((v) =>
            String(v ?? '')
              .toLocaleLowerCase('pt-BR')
              .includes(q),
          )),
    )
  }, [items, status, query])
  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 px-5 py-8 sm:px-10">
      <div className="max-w-5xl mx-auto space-y-7">
        <nav
          aria-label="Navegação"
          className="flex flex-wrap gap-5 text-sm text-amber-200 underline"
        >
          <Link to="/">Início</Link>
          <Link to="/explorar">Explorador técnico</Link>
          <Link to="/adapta">Chegada à Adapta</Link>
        </nav>
        <header className="space-y-3">
          <p className="text-xs tracking-widest uppercase text-amber-300">
            São Paulo 3D · catálogo público
          </p>
          <h1 className="text-3xl sm:text-4xl font-light">Empreendimentos</h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Somente registros publicados pela administração. O catálogo não comprova a forma ou a
            atualidade dos prédios; a réplica 3D permanece em construção.
          </p>
        </header>
        <section aria-label="Filtros da página atual" className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-2 text-sm">
            Buscar nesta página
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome, endereço ou bairro"
              className="block w-full rounded-xl border border-slate-600 bg-slate-900 p-3"
            />
          </label>
          <label className="space-y-2 text-sm">
            Status nesta página
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block w-full rounded-xl border border-slate-600 bg-slate-900 p-3"
            >
              <option value="todos">Todos ({items.length})</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({items.filter((item) => item.status === option.value).length})
                </option>
              ))}
            </select>
          </label>
        </section>
        {loading ? (
          <p role="status">Carregando catálogo...</p>
        ) : error ? (
          <section role="alert" className="border border-amber-400/30 rounded-xl p-6 space-y-4">
            <p>Não foi possível carregar o catálogo. Verifique sua conexão.</p>
            <button
              type="button"
              onClick={() => setAttempt((v) => v + 1)}
              className="rounded-lg bg-amber-300 text-slate-950 px-5 py-3"
            >
              Tentar novamente
            </button>
          </section>
        ) : (
          <>
            <p role="status" className="text-sm text-slate-400">
              {visible.length} nesta página · {total} publicado(s) no catálogo
            </p>
            {total === 0 ? (
              <section className="rounded-2xl border border-slate-700 p-8 space-y-2">
                <h2 className="text-xl">Nenhum empreendimento publicado</h2>
                <p className="text-slate-400">
                  Os imóveis aparecerão aqui após o cadastro e a publicação pela administração.
                  Nenhum imóvel fictício foi adicionado para preencher esta página.
                </p>
              </section>
            ) : visible.length === 0 ? (
              <p>Nenhum resultado nesta página para os filtros selecionados.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {visible.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-700 bg-slate-900/50 p-6 space-y-3"
                  >
                    <p className="text-xs uppercase tracking-wider text-amber-200">
                      {isEmpreendimentoStatus(item.status)
                        ? STATUS_LABEL[item.status]
                        : 'Status não informado'}
                    </p>
                    <h2 className="text-xl break-words">{item.nome}</h2>
                    <p className="text-sm text-slate-400 break-words">
                      {item.endereco}
                      {item.bairro ? ` · ${item.bairro}` : ''}
                    </p>
                    {item.area_min > 0 && (
                      <p className="text-sm">
                        Área: {item.area_min.toLocaleString('pt-BR')}
                        {item.area_max > item.area_min
                          ? ` a ${item.area_max.toLocaleString('pt-BR')}`
                          : ''}{' '}
                        m²
                      </p>
                    )}
                    {item.ano_entrega > 0 && (
                      <p className="text-sm">Ano cadastrado de entrega: {item.ano_entrega}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
            {pages > 1 && (
              <nav aria-label="Páginas do catálogo" className="flex items-center gap-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((v) => v - 1)}
                  className="border rounded-lg p-3 disabled:opacity-40"
                >
                  Anterior
                </button>
                <span>
                  {page} de {pages}
                </span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((v) => v + 1)}
                  className="border rounded-lg p-3 disabled:opacity-40"
                >
                  Próxima
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}
