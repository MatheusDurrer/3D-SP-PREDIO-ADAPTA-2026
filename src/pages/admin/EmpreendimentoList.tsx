// Lista de empreendimentos: busca local, filtro por status, contagem,
// badge de publicado, ações editar/excluir (com confirmação real).

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import {
  capaUrl,
  deleteEmpreendimento,
  listEmpreendimentos,
  normalizeError,
} from '@/services/empreendimentos'
import { STATUS_LABEL, STATUS_OPTIONS, type Empreendimento } from '@/types/empreendimento'

const STATUS_STYLE: Record<string, string> = {
  lancamento: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
  obras: 'bg-sky-400/10 text-sky-300 border-sky-400/30',
  futuro: 'bg-violet-400/10 text-violet-300 border-violet-400/30',
  entregue: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30',
}

export default function EmpreendimentoList() {
  const [items, setItems] = useState<Empreendimento[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [deleting, setDeleting] = useState<Empreendimento | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await listEmpreendimentos({ perPage: 500 })
      setItems(res.items)
      setTotal(res.totalItems)
    } catch (err) {
      setError(normalizeError(err).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      const matchQ =
        !q ||
        it.nome.toLowerCase().includes(q) ||
        it.bairro.toLowerCase().includes(q) ||
        it.endereco.toLowerCase().includes(q) ||
        it.slug.toLowerCase().includes(q)
      const matchS = statusFilter === 'todos' || it.status === statusFilter
      return matchQ && matchS
    })
  }, [items, query, statusFilter])

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await deleteEmpreendimento(deleting.id)
      setDeleting(null)
      await load()
    } catch (err) {
      setError(normalizeError(err).message)
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-slate-100">Empreendimentos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Carregando…' : `${filtered.length} de ${total} registro(s)`}
          </p>
        </div>
        <Link
          to="/admin/novo"
          className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-medium rounded-md px-3.5 py-2"
        >
          <Plus className="w-4 h-4" aria-hidden />
          Novo empreendimento
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, bairro, endereço ou slug…"
            className="w-full bg-slate-900/60 border border-slate-800 rounded-md pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filtrar por status"
          className="bg-slate-900/60 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-400/50"
        >
          <option value="todos">Todos os status</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p
          role="alert"
          className="text-xs text-red-400 bg-red-400/5 border border-red-400/20 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-lg py-16 text-center">
          <p className="text-sm text-slate-400">
            {items.length === 0
              ? 'Nenhum empreendimento cadastrado ainda.'
              : 'Nenhum resultado para os filtros atuais.'}
          </p>
          {items.length === 0 && (
            <Link
              to="/admin/novo"
              className="inline-block mt-3 text-xs text-amber-300 hover:underline"
            >
              Cadastrar o primeiro
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="list">
          {filtered.map((it) => (
            <li
              key={it.id}
              className="border border-slate-800 bg-slate-900/40 rounded-lg overflow-hidden flex flex-col"
            >
              <div className="h-28 bg-slate-900 shrink-0 overflow-hidden">
                {capaUrl(it) ? (
                  <img
                    src={capaUrl(it)}
                    alt={`Capa de ${it.nome}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-700 text-xs">
                    sem capa
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{it.nome}</p>
                    <p className="text-xs text-slate-500 truncate">{it.bairro || '—'}</p>
                  </div>
                  {it.publicado ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-300 border border-emerald-400/30 bg-emerald-400/10 rounded px-1.5 py-0.5 shrink-0">
                      <Eye className="w-3 h-3" aria-hidden /> público
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 border border-slate-700 rounded px-1.5 py-0.5 shrink-0">
                      <EyeOff className="w-3 h-3" aria-hidden /> oculto
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] border rounded px-1.5 py-0.5 ${STATUS_STYLE[it.status] ?? ''}`}
                  >
                    {STATUS_LABEL[it.status]}
                  </span>
                  {it.ano_entrega > 0 && (
                    <span className="text-[10px] text-slate-500">entrega {it.ano_entrega}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-[10px] text-slate-600 truncate">/{it.slug}</span>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/admin/editar/${it.id}`}
                      aria-label={`Editar ${it.nome}`}
                      className="p-1.5 rounded text-slate-400 hover:text-amber-300 hover:bg-amber-400/10"
                    >
                      <Pencil className="w-4 h-4" aria-hidden />
                    </Link>
                    <button
                      type="button"
                      aria-label={`Excluir ${it.nome}`}
                      onClick={() => setDeleting(it)}
                      className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="del-title"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 max-w-sm w-full space-y-3">
            <h2 id="del-title" className="text-sm font-medium text-slate-100">
              Excluir empreendimento?
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              “{deleting.nome}” será removido permanentemente, incluindo fotos e modelo 3D
              vinculados. Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="text-xs text-slate-300 border border-slate-700 rounded px-3 py-1.5 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteBusy}
                className="text-xs bg-red-500/90 hover:bg-red-500 disabled:opacity-50 text-white rounded px-3 py-1.5"
              >
                {deleteBusy ? 'Excluindo…' : 'Excluir definitivamente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
