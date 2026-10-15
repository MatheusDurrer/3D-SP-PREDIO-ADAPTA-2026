// Serviço tipado do admin SP3D — única porta de entrada para sp3d_empreendimentos.
// CRUD real via SDK PocketBase (client auto-gerado do template). FormData real
// para arquivos; remoção de foto usa modifier "fotos-" (sem re-upload do resto).

import pb from '@/lib/pocketbase/client'
import { ClientResponseError } from 'pocketbase'
import {
  buildFileUrl,
  isEmpreendimentoStatus,
  type Empreendimento,
  type EmpreendimentoFormValues,
  type PendingFiles,
  type PersistedFileInfo,
} from '@/types/empreendimento'

export const COLLECTION = 'sp3d_empreendimentos'

export interface ListOptions {
  page?: number
  perPage?: number
  sort?: string
  filter?: string
}

export interface ListResult {
  items: Empreendimento[]
  totalItems: number
  totalPages: number
  page: number
}

function toEmpreendimento(r: Record<string, unknown>): Empreendimento {
  const status = r.status
  return {
    id: String(r.id ?? ''),
    slug: String(r.slug ?? ''),
    nome: String(r.nome ?? ''),
    status: isEmpreendimentoStatus(status) ? status : 'lancamento',
    ano_entrega: Number(r.ano_entrega ?? 0),
    endereco: String(r.endereco ?? ''),
    bairro: String(r.bairro ?? ''),
    lat: Number(r.lat ?? 0),
    lng: Number(r.lng ?? 0),
    area_min: Number(r.area_min ?? 0),
    area_max: Number(r.area_max ?? 0),
    dorms: String(r.dorms ?? ''),
    suites: String(r.suites ?? ''),
    fotos: Array.isArray(r.fotos) ? (r.fotos as string[]).map(String) : [],
    capa: String(r.capa ?? ''),
    modelo_glb: String(r.modelo_glb ?? ''),
    altura_m: Number(r.altura_m ?? 0),
    rotacao_graus: Number(r.rotacao_graus ?? 0),
    cor_destaque: String(r.cor_destaque ?? ''),
    ordem: Number(r.ordem ?? 0),
    publicado: Boolean(r.publicado),
    created: String(r.created ?? ''),
    updated: String(r.updated ?? ''),
    collectionId: String(r.collectionId ?? ''),
    collectionName: String(r.collectionName ?? ''),
  }
}

export async function listEmpreendimentos(opts: ListOptions = {}): Promise<ListResult> {
  const res = await pb.collection(COLLECTION).getList(1, 500, {
    sort: opts.sort ?? 'ordem,-created',
    filter: opts.filter,
    requestKey: null,
  })
  return {
    items: res.items.map(toEmpreendimento),
    totalItems: res.totalItems,
    totalPages: res.totalPages,
    page: res.page,
  }
}

export async function getEmpreendimento(id: string): Promise<Empreendimento> {
  const r = await pb.collection(COLLECTION).getOne(id, { requestKey: null })
  return toEmpreendimento(r as unknown as Record<string, unknown>)
}

/** Validação de coordenadas — lat/lng dentro do envelope do município de SP. */
export function validateCoords(lat: number, lng: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return 'Coordenadas devem ser números.'
  // Envelope aproximado da cidade de São Paulo (PRD: réplica da cidade).
  if (lat < -24.008 || lat > -23.356)
    return 'Latitude fora do envelope de São Paulo (-24.008 a -23.356).'
  if (lng < -46.826 || lng > -46.365)
    return 'Longitude fora do envelope de São Paulo (-46.826 a -46.365).'
  return null
}

export interface SaveResult {
  record: Empreendimento
}

/**
 * Cria ou atualiza. Campos numéricos vazios vão como '' (PB aceita string
 * vazia em number opcional); arquivos novos via FormData; remoção de foto
 * persistida via modifier "fotos-<nome>" sem tocar nas demais.
 */
export async function saveEmpreendimento(
  id: string | null,
  values: EmpreendimentoFormValues,
  files: PendingFiles,
  removeFotos: string[],
): Promise<SaveResult> {
  const fd = new FormData()
  const textFields: (keyof EmpreendimentoFormValues)[] = [
    'slug',
    'nome',
    'status',
    'ano_entrega',
    'endereco',
    'bairro',
    'lat',
    'lng',
    'area_min',
    'area_max',
    'dorms',
    'suites',
    'altura_m',
    'rotacao_graus',
    'cor_destaque',
    'ordem',
  ]
  for (const key of textFields) {
    fd.append(key, String(values[key] ?? ''))
  }
  fd.append('publicado', values.publicado ? 'true' : 'false')

  for (const f of files.fotos) fd.append('fotos', f, f.name)
  if (files.capa) fd.append('capa', files.capa, files.capa.name)
  if (files.modelo_glb) fd.append('modelo_glb', files.modelo_glb, files.modelo_glb.name)
  for (const name of removeFotos) fd.append('fotos-', name)

  try {
    const record = id
      ? await pb.collection(COLLECTION).update(id, fd)
      : await pb.collection(COLLECTION).create(fd)
    return { record: toEmpreendimento(record as unknown as Record<string, unknown>) }
  } catch (err) {
    throw normalizeError(err)
  }
}

export async function deleteEmpreendimento(id: string): Promise<void> {
  try {
    await pb.collection(COLLECTION).delete(id)
  } catch (err) {
    throw normalizeError(err)
  }
}

export function persistedFiles(rec: Empreendimento): PersistedFileInfo[] {
  return rec.fotos.map((name) => ({ name, url: buildFileUrl(rec, name) }))
}

export function capaUrl(rec: Empreendimento): string {
  return rec.capa ? buildFileUrl(rec, rec.capa) : ''
}

/** Erro real, sem stack nem detalhe interno; mensagem amigável em pt-BR. */
export function normalizeError(err: unknown): Error {
  if (err instanceof ClientResponseError) {
    const status = err.status
    if (status === 400) {
      const data = err.response?.data as Record<string, { message?: string }> | undefined
      const first = data ? Object.values(data).find((d) => d?.message)?.message : undefined
      return new Error(first || 'Dados inválidos. Verifique os campos e tente novamente.')
    }
    if (status === 401 || status === 403) {
      return new Error('Sessão expirada ou sem permissão. Faça login novamente.')
    }
    if (status === 404) return new Error('Registro não encontrado. Ele pode ter sido excluído.')
    if (status === 0) return new Error('Falha de conexão com o servidor. Verifique sua rede.')
    return new Error('O servidor recusou a operação. Tente novamente em instantes.')
  }
  return err instanceof Error ? err : new Error('Erro inesperado.')
}
