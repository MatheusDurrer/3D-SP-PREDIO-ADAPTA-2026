// Formulário de empreendimento: criação (/admin/novo) e edição (/admin/editar/:id).
// Save com await + recarga da lista; erros reais sem stack; coords validadas.

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import {
  getEmpreendimento,
  normalizeError,
  saveEmpreendimento,
  validateCoords,
} from '@/services/empreendimentos'
import {
  STATUS_OPTIONS,
  type Empreendimento,
  type EmpreendimentoFormValues,
  type PendingFiles,
} from '@/types/empreendimento'
import FileSection from './FileSection'

const EMPTY: EmpreendimentoFormValues = {
  slug: '',
  nome: '',
  status: 'lancamento',
  ano_entrega: '',
  endereco: '',
  bairro: '',
  lat: '',
  lng: '',
  area_min: '',
  area_max: '',
  dorms: '',
  suites: '',
  altura_m: '',
  rotacao_graus: '',
  cor_destaque: '',
  ordem: '0',
  publicado: false,
}

function toFormValues(r: Empreendimento): EmpreendimentoFormValues {
  return {
    slug: r.slug,
    nome: r.nome,
    status: r.status,
    ano_entrega: r.ano_entrega ? String(r.ano_entrega) : '',
    endereco: r.endereco,
    bairro: r.bairro,
    lat: r.lat ? String(r.lat) : '',
    lng: r.lng ? String(r.lng) : '',
    area_min: r.area_min ? String(r.area_min) : '',
    area_max: r.area_max ? String(r.area_max) : '',
    dorms: r.dorms,
    suites: r.suites,
    altura_m: r.altura_m ? String(r.altura_m) : '',
    rotacao_graus: r.rotacao_graus ? String(r.rotacao_graus) : '',
    cor_destaque: r.cor_destaque,
    ordem: String(r.ordem ?? 0),
    publicado: r.publicado,
  }
}

export default function EmpreendimentoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [values, setValues] = useState<EmpreendimentoFormValues>(EMPTY)
  const [record, setRecord] = useState<Empreendimento | null>(null)
  const [pending, setPending] = useState<PendingFiles>({ fotos: [], capa: null, modelo_glb: null })
  const [removeFotos, setRemoveFotos] = useState<string[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    let alive = true
    setLoading(true)
    getEmpreendimento(id)
      .then((r) => {
        if (!alive) return
        setRecord(r)
        setValues(toFormValues(r))
      })
      .catch((err) => alive && setError(normalizeError(err).message))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [id])

  function set<K extends keyof EmpreendimentoFormValues>(key: K, v: EmpreendimentoFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  function validate(): string | null {
    if (!values.nome.trim()) return 'Informe o nome do empreendimento.'
    if (!values.slug.trim()) return 'Informe o slug (ex.: torres-do-parque).'
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug.trim()))
      return 'Slug inválido: use minúsculas, números e hífens (ex.: torres-do-parque).'
    if (!values.lat.trim() || !values.lng.trim()) return 'Informe latitude e longitude do imóvel.'
    const lat = Number(values.lat.replace(',', '.'))
    const lng = Number(values.lng.replace(',', '.'))
    const coordErr = validateCoords(lat, lng)
    if (coordErr) return coordErr
    if (values.ano_entrega && !/^\d{4}$/.test(values.ano_entrega.trim()))
      return 'Ano de entrega deve ter 4 dígitos (ex.: 2027).'
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const vErr = validate()
    if (vErr) {
      setError(vErr)
      return
    }
    setSaving(true)
    try {
      const payload: EmpreendimentoFormValues = {
        ...values,
        slug: values.slug.trim(),
        nome: values.nome.trim(),
        lat: values.lat.replace(',', '.'),
        lng: values.lng.replace(',', '.'),
      }
      await saveEmpreendimento(isEdit ? (id as string) : null, payload, pending, removeFotos)
      navigate('/admin', { replace: true })
    } catch (err) {
      const msg = normalizeError(err).message
      setError(msg)
      if (err instanceof Object && 'response' in err) {
        const data = (err as { response?: { data?: Record<string, { message?: string }> } })
          .response?.data
        if (data) {
          const fe: Record<string, string> = {}
          for (const [k, d] of Object.entries(data)) if (d?.message) fe[k] = d.message
          setFieldErrors(fe)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full bg-slate-900/60 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400/50'
  const labelCls = 'text-xs text-slate-400 tracking-wide'
  const errFor = (k: string) => fieldErrors[k] ?? null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            aria-label="Voltar para a lista"
            className="p-2 -ml-2 rounded text-slate-400 hover:text-amber-300 hover:bg-amber-400/10"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
          </Link>
          <h1 className="text-lg font-medium text-slate-100">
            {isEdit ? `Editar: ${record?.nome || '…'}` : 'Novo empreendimento'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-sm font-medium rounded-md px-3.5 py-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Save className="w-4 h-4" aria-hidden />
          )}
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="text-xs text-red-400 bg-red-400/5 border border-red-400/20 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}

      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="f-nome" className={labelCls}>
            Nome *
          </label>
          <input
            id="f-nome"
            value={values.nome}
            onChange={(e) => set('nome', e.target.value)}
            className={inputCls}
            placeholder="Torres do Parque"
          />
          {errFor('nome') && <p className="text-[11px] text-red-400">{errFor('nome')}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-slug" className={labelCls}>
            Slug * (URL /imovel/slug)
          </label>
          <input
            id="f-slug"
            value={values.slug}
            onChange={(e) => set('slug', e.target.value)}
            className={inputCls}
            placeholder="torres-do-parque"
          />
          {errFor('slug') && <p className="text-[11px] text-red-400">{errFor('slug')}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-status" className={labelCls}>
            Status *
          </label>
          <select
            id="f-status"
            value={values.status}
            onChange={(e) => set('status', e.target.value as EmpreendimentoFormValues['status'])}
            className={inputCls}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-ano" className={labelCls}>
            Ano de entrega
          </label>
          <input
            id="f-ano"
            inputMode="numeric"
            value={values.ano_entrega}
            onChange={(e) => set('ano_entrega', e.target.value)}
            className={inputCls}
            placeholder="2027"
          />
          {errFor('ano_entrega') && (
            <p className="text-[11px] text-red-400">{errFor('ano_entrega')}</p>
          )}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="f-endereco" className={labelCls}>
            Endereço
          </label>
          <input
            id="f-endereco"
            value={values.endereco}
            onChange={(e) => set('endereco', e.target.value)}
            className={inputCls}
            placeholder="Av. Brigadeiro Faria Lima, 4500"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-bairro" className={labelCls}>
            Bairro
          </label>
          <input
            id="f-bairro"
            value={values.bairro}
            onChange={(e) => set('bairro', e.target.value)}
            className={inputCls}
            placeholder="Itaim Bibi"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-cor" className={labelCls}>
            Cor de destaque (hex)
          </label>
          <div className="flex gap-2">
            <input
              id="f-cor"
              value={values.cor_destaque}
              onChange={(e) => set('cor_destaque', e.target.value)}
              className={inputCls}
              placeholder="#d4a017"
            />
            <input
              type="color"
              aria-label="Selecionar cor de destaque"
              value={
                /^#[0-9a-fA-F]{6}$/.test(values.cor_destaque) ? values.cor_destaque : '#d4a017'
              }
              onChange={(e) => set('cor_destaque', e.target.value)}
              className="w-10 shrink-0 rounded border border-slate-800 bg-slate-900/60 cursor-pointer"
            />
          </div>
          {errFor('cor_destaque') && (
            <p className="text-[11px] text-red-400">{errFor('cor_destaque')}</p>
          )}
        </div>
      </div>

      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4 grid gap-4 sm:grid-cols-2">
        <p className="text-xs text-slate-500 sm:col-span-2">
          Coordenadas decimais (WGS84) dentro do envelope do município de São Paulo.
        </p>
        <div className="space-y-1.5">
          <label htmlFor="f-lat" className={labelCls}>
            Latitude *
          </label>
          <input
            id="f-lat"
            inputMode="decimal"
            value={values.lat}
            onChange={(e) => set('lat', e.target.value)}
            className={inputCls}
            placeholder="-23.588"
          />
          {errFor('lat') && <p className="text-[11px] text-red-400">{errFor('lat')}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-lng" className={labelCls}>
            Longitude *
          </label>
          <input
            id="f-lng"
            inputMode="decimal"
            value={values.lng}
            onChange={(e) => set('lng', e.target.value)}
            className={inputCls}
            placeholder="-46.660"
          />
          {errFor('lng') && <p className="text-[11px] text-red-400">{errFor('lng')}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-area-min" className={labelCls}>
            Área mínima (m²)
          </label>
          <input
            id="f-area-min"
            inputMode="decimal"
            value={values.area_min}
            onChange={(e) => set('area_min', e.target.value)}
            className={inputCls}
            placeholder="45"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-area-max" className={labelCls}>
            Área máxima (m²)
          </label>
          <input
            id="f-area-max"
            inputMode="decimal"
            value={values.area_max}
            onChange={(e) => set('area_max', e.target.value)}
            className={inputCls}
            placeholder="120"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-dorms" className={labelCls}>
            Dormitórios
          </label>
          <input
            id="f-dorms"
            value={values.dorms}
            onChange={(e) => set('dorms', e.target.value)}
            className={inputCls}
            placeholder="1, 2, 3"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-suites" className={labelCls}>
            Suítes
          </label>
          <input
            id="f-suites"
            value={values.suites}
            onChange={(e) => set('suites', e.target.value)}
            className={inputCls}
            placeholder="1, 2"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-altura" className={labelCls}>
            Altura (m)
          </label>
          <input
            id="f-altura"
            inputMode="decimal"
            value={values.altura_m}
            onChange={(e) => set('altura_m', e.target.value)}
            className={inputCls}
            placeholder="98.5"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-rot" className={labelCls}>
            Rotação (graus)
          </label>
          <input
            id="f-rot"
            inputMode="decimal"
            value={values.rotacao_graus}
            onChange={(e) => set('rotacao_graus', e.target.value)}
            className={inputCls}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="f-ordem" className={labelCls}>
            Ordem de exibição
          </label>
          <input
            id="f-ordem"
            inputMode="numeric"
            value={values.ordem}
            onChange={(e) => set('ordem', e.target.value)}
            className={inputCls}
            placeholder="0"
          />
        </div>
        <div className="flex items-end">
          <label
            htmlFor="f-publicado"
            className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none"
          >
            <input
              id="f-publicado"
              type="checkbox"
              checked={values.publicado}
              onChange={(e) => set('publicado', e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 accent-amber-400"
            />
            Publicado (visível no mapa público)
          </label>
        </div>
      </div>

      <div className="border border-slate-800 bg-slate-900/40 rounded-lg p-4">
        <FileSection
          record={record}
          pending={pending}
          setPending={setPending}
          removeFotos={removeFotos}
          setRemoveFotos={setRemoveFotos}
        />
      </div>

      <div className="flex justify-end gap-2 pb-4">
        <Link
          to="/admin"
          className="text-xs text-slate-300 border border-slate-700 rounded px-3 py-2 hover:bg-slate-800"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-sm font-medium rounded-md px-3.5 py-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Save className="w-4 h-4" aria-hidden />
          )}
          {saving ? 'Salvando…' : 'Salvar empreendimento'}
        </button>
      </div>
    </form>
  )
}
