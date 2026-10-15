// Tipos do domínio SP3D — contrato do PRD (coleção sp3d_empreendimentos).
// Fonte: uploads/c4abcaf8-PRD_S_o_Paulo_3D_r_plica_fiel_da_cidade.pdf, RF-13.

export type EmpreendimentoStatus = 'lancamento' | 'obras' | 'futuro' | 'entregue'

export const STATUS_OPTIONS: { value: EmpreendimentoStatus; label: string }[] = [
  { value: 'lancamento', label: 'Lançamento' },
  { value: 'obras', label: 'Em obras' },
  { value: 'futuro', label: 'Futuro lançamento' },
  { value: 'entregue', label: 'Entregue' },
]

export const STATUS_LABEL: Record<EmpreendimentoStatus, string> = STATUS_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.value]: o.label }),
  {} as Record<EmpreendimentoStatus, string>,
)

/** Registro conforme coleção sp3d_empreendimentos (PRD). */
export interface Empreendimento {
  id: string
  slug: string
  nome: string
  status: EmpreendimentoStatus
  ano_entrega: number
  endereco: string
  bairro: string
  lat: number
  lng: number
  area_min: number
  area_max: number
  dorms: string
  suites: string
  /** Nomes de arquivo do campo arquivo múltiplo do PocketBase. */
  fotos: string[]
  capa: string
  modelo_glb: string
  altura_m: number
  rotacao_graus: number
  cor_destaque: string
  ordem: number
  publicado: boolean
  created: string
  updated: string
  collectionId?: string
  collectionName?: string
}

/** Payload do formulário admin — arquivos via FormData; campos vazios = ''. */
export interface EmpreendimentoFormValues {
  slug: string
  nome: string
  status: EmpreendimentoStatus
  ano_entrega: string
  endereco: string
  bairro: string
  lat: string
  lng: string
  area_min: string
  area_max: string
  dorms: string
  suites: string
  altura_m: string
  rotacao_graus: string
  cor_destaque: string
  ordem: string
  publicado: boolean
}

/** Novos arquivos escolhidos no formulário (ainda não persistidos). */
export interface PendingFiles {
  fotos: File[]
  capa: File | null
  modelo_glb: File | null
}

/** Arquivos já persistidos, para exibição e remoção via modifier fotos-. */
export interface PersistedFileInfo {
  name: string
  url: string
}

export function buildFileUrl(record: Empreendimento, filename: string): string {
  if (!filename) return ''
  const base = pbFileBase()
  if (!base) return ''
  return `${base}/api/files/${record.collectionId}/${record.id}/${encodeURIComponent(filename)}`
}

function pbFileBase(): string {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env
  return env?.VITE_POCKETBASE_URL ?? ''
}

export function isEmpreendimentoStatus(v: unknown): v is EmpreendimentoStatus {
  return typeof v === 'string' && ['lancamento', 'obras', 'futuro', 'entregue'].includes(v)
}
