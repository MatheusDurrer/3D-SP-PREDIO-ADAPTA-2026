import pb from '@/lib/pocketbase/client'

export interface ArrivalConfig {
  nome: string
  edificio: string
  endereco: string
  entrada_confirmada: boolean
  instrucao_entrada: string
  aviso: string
  fontes: { titulo: string; url: string }[]
}

export async function loadArrival(): Promise<ArrivalConfig> {
  const data = await pb.send('/backend/v1/sp3d/catalogo', { method: 'GET' })
  const config = data.config?.find(
    (item: { chave: string }) => item.chave === 'chegada_adapta',
  )?.dados
  if (!config || typeof config.endereco !== 'string' || !config.endereco.trim()) {
    throw new Error('As orientações de chegada ainda não estão disponíveis.')
  }
  return config as ArrivalConfig
}

/** Address search: the visitor confirms the matching destination in Waze. */
export function wazeUrl(address: string): string {
  const params = new URLSearchParams({ q: address, utm_source: 'adapta_eventos' })
  return `https://waze.com/ul?${params.toString()}`
}

export function directionsUrl(address: string, mode: 'walking' | 'driving'): string {
  const params = new URLSearchParams({ api: '1', destination: address, travelmode: mode })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/**
 * Posição do edifício para o mapa da região. Fonte: centróide LiDAR 2020 da torre NORTE
 * (public/scene/adapta-v1.json → adapta_contour.centroid_wgs84, identidade
 * ADAPTA_BERRINI_ONE_NORTH, andares 31–32 confirmados pela organização). Medição histórica —
 * não indica portaria de entrada; o visitante navega pelo endereço. O geocode OSM do número
 * 105 ("Thera Corporate") aponta a torre sul do complexo e NÃO é usado.
 */
export const MAPA_REGIAO = {
  lat: -23.597969459597447,
  lng: -46.6904645773493,
  bbox: '-46.6984646,-23.6019695,-46.6824646,-23.5939695',
}
