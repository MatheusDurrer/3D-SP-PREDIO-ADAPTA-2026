import pb from '@/lib/pocketbase/client'
import type { Empreendimento } from '@/types/empreendimento'

/** Public inventory only. Explicit filter also applies to an authenticated admin. */
export async function loadPublished(page: number, signal: AbortSignal) {
  return pb.collection<Empreendimento>('sp3d_empreendimentos').getList(page, 24, {
    filter: 'publicado = true',
    sort: 'ordem,nome',
    fields:
      'id,slug,nome,status,endereco,bairro,ano_entrega,area_min,area_max,dorms,suites,publicado',
    requestKey: null,
    signal,
  })
}
