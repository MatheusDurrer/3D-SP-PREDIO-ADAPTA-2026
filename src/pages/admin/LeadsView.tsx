// Leitura de leads para o admin (RF-14 alimenta sp3d_leads; admin lê).
// Estado vazio explícito e erro amigável se a coleção não estiver criada.

import { useEffect, useState } from 'react'
import { Loader2, Users } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { normalizeError } from '@/services/empreendimentos'

interface LeadRow {
  id: string
  nome: string
  telefone: string
  email: string
  mensagem: string
  empreendimento: string
  origem: string
  created: string
}

export default function LeadsView() {
  const [rows, setRows] = useState<LeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const res = await pb.collection('sp3d_leads').getList(1, 200, {
          sort: '-created',
          requestKey: null,
        })
        if (!alive) return
        setRows(
          res.items.map((r) => {
            const rec = r as unknown as Record<string, unknown>
            return {
              id: String(rec.id ?? ''),
              nome: String(rec.nome ?? ''),
              telefone: String(rec.telefone ?? ''),
              email: String(rec.email ?? ''),
              mensagem: String(rec.mensagem ?? ''),
              empreendimento: String(rec.empreendimento ?? ''),
              origem: String(rec.origem ?? ''),
              created: String(rec.created ?? ''),
            }
          }),
        )
      } catch (err) {
        if (alive) setError(normalizeError(err).message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-medium text-slate-100">Leads</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Contatos recebidos pelo mapa público (RF-14). Somente leitura.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
        </div>
      )}

      {!loading && error && (
        <div className="border border-dashed border-slate-800 rounded-lg py-14 text-center px-4">
          <Users className="w-6 h-6 text-slate-600 mx-auto mb-3" aria-hidden />
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            A coleção de leads ainda não está disponível no backend — ela será criada junto com o
            schema do projeto. Esta tela passa a listar automaticamente quando existir.
          </p>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="border border-dashed border-slate-800 rounded-lg py-14 text-center">
          <p className="text-sm text-slate-400">Nenhum lead recebido ainda.</p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs text-slate-500">
                <th className="px-3 py-2 font-medium">Recebido</th>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Contato</th>
                <th className="px-3 py-2 font-medium">Empreendimento</th>
                <th className="px-3 py-2 font-medium">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                    {r.created ? new Date(r.created).toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-200">{r.nome || '—'}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {r.email && <div>{r.email}</div>}
                    {r.telefone && <div>{r.telefone}</div>}
                    {!r.email && !r.telefone && '—'}
                  </td>
                  <td className="px-3 py-2 text-xs text-amber-200/80">{r.empreendimento || '—'}</td>
                  <td className="px-3 py-2 text-xs text-slate-400 max-w-[240px] truncate">
                    {r.mensagem || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
