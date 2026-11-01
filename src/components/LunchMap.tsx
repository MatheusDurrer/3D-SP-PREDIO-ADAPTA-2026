import { useEffect, useRef, useState } from 'react'
import { AttributionControl, Map as MapLibreMap, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export interface LunchSpot {
  id: string
  nome: string
  destaque: boolean
  endereco: string
  horario: string
  tipo: string
  coords: [number, number]
  coords_note: string
  links: { site: string; instagram?: string }
}

export interface LunchData {
  schema: string
  attribution_note: string
  adapta_footprint: {
    type: 'Feature'
    properties: Record<string, string>
    geometry: { type: 'Polygon'; coordinates: [number, number][][] }
  }
  spots: LunchSpot[]
}

const DATA_URL = '/lunch-spots-v1.json'
// Centroid of the measured footprint (validated 2026-10-31, delta 2.11 m vs published).
export const ADAPTA_CENTER: [number, number] = [-46.6904833, -23.5979777]

export async function loadLunchData(): Promise<LunchData> {
  const response = await fetch(DATA_URL, { cache: 'no-store' })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = (await response.json()) as LunchData
  if (data.schema !== 'sp3d_lunch_spots/1' || !Array.isArray(data.spots) || data.spots.length === 0)
    throw new Error('Dados de restaurantes indisponíveis')
  return data
}

export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

/**
 * Mapa interativo MapLibre com footprint medido da torre Adapta (Berrini One)
 * e pins de restaurantes. Sem WebGL: fallback com iframe OSM.
 * Nenhum dado de visitante é coletado; tiles OSM (ODbL).
 */
export default function LunchMap({
  data,
  selectedId,
  onSelect,
}: {
  data: LunchData
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<string, Marker>>(new Map())
  const [glError, setGlError] = useState<string | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (!webglAvailable()) {
      setGlError('WebGL indisponível — exibindo mapa estático da região.')
      return
    }
    let disposed = false
    let map: MapLibreMap | null = null
    try {
      map = new MapLibreMap({
        container: host,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors (ODbL)',
            },
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
        },
        center: ADAPTA_CENTER,
        zoom: 15.5,
        attributionControl: false,
      })
      map.addControl(new AttributionControl({ compact: true }))
      mapRef.current = map
      map.on('error', () => setGlError('Falha no mapa — exibindo mapa estático da região.'))
    } catch {
      setGlError('Falha ao iniciar o mapa — exibindo mapa estático da região.')
      return
    }
    map.on('load', () => {
      if (disposed) return
      // Footprint Adapta (medido, LiDAR 2020) — destaque âmbar
      map!.addSource('adapta-footprint', { type: 'geojson', data: data.adapta_footprint })
      map!.addLayer({
        id: 'adapta-fill',
        type: 'fill',
        source: 'adapta-footprint',
        paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.18 },
      })
      map!.addLayer({
        id: 'adapta-outline',
        type: 'line',
        source: 'adapta-footprint',
        paint: { 'line-color': '#f59e0b', 'line-width': 2.5 },
      })
      // Pins dos restaurantes
      for (const spot of data.spots) {
        const el = document.createElement('button')
        el.className = spot.destaque ? 'sp3d-pin sp3d-pin-featured' : 'sp3d-pin'
        el.setAttribute('aria-label', spot.nome)
        el.title = spot.nome
        el.addEventListener('click', () => onSelect(spot.id))
        const marker = new Marker({ element: el }).setLngLat(spot.coords).addTo(map!)
        markersRef.current.set(spot.id, marker)
      }
    })
    return () => {
      disposed = true
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      map?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Focus no pin selecionado (flyTo) sem recriar o mapa
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedId) return
    const spot = data.spots.find((s) => s.id === selectedId)
    if (spot) map.flyTo({ center: spot.coords, zoom: Math.max(map.getZoom(), 16.5), duration: 600 })
  }, [selectedId, data.spots])

  if (glError) {
    return (
      <div className="space-y-3">
        <p role="status" className="text-sm text-amber-200">
          {glError}
        </p>
        <iframe
          title="Mapa da região · OpenStreetMap"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=-46.712,-23.632,-46.672,-23.588&layer=mapnik&marker=${ADAPTA_CENTER[1]},${ADAPTA_CENTER[0]}`}
          loading="lazy"
          className="h-72 w-full rounded-lg border border-slate-700 sm:h-80"
        />
      </div>
    )
  }
  return <div ref={hostRef} className="h-80 w-full rounded-lg border border-slate-700 sm:h-96" />
}
