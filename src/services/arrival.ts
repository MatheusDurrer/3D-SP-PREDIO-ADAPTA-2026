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

export function directionsUrl(address: string, mode: 'walking' | 'driving'): string {
  const params = new URLSearchParams({ api: '1', destination: address, travelmode: mode })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
