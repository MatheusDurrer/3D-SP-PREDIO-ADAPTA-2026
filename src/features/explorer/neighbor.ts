import * as THREE from 'three'
import { sha256Hex } from './ground'

export interface NeighborReference {
  schema: string
  id: string
  epoch: number
  status: string
  name: null
  origin_utm: number[]
  axes: string
  ring_xz: number[][]
  base_abs_m: number
  top_abs_m: number
  method: string
  source_profile_sha256: string
}

export async function loadNeighborReference(signal: AbortSignal): Promise<NeighborReference> {
  const response = await fetch('/scene/neighbor-sse-reference-v1.json', {
    cache: 'no-store',
    signal,
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const raw = await response.arrayBuffer()
  if (raw.byteLength > 12000) throw new Error('Perfil SSE excede limite')
  if ((await sha256Hex(raw)) !== '555cd411cf2eb6f4073e993c0dd0e471637b796145f2c4610bb381ff68fd0279')
    throw new Error('SHA-256 do perfil SSE divergente')
  const data = JSON.parse(new TextDecoder().decode(raw)) as NeighborReference
  if (
    data.schema !== 'sp3d-neighbor-reference/1' ||
    data.epoch !== 2020 ||
    data.origin_utm?.[0] !== 327514 ||
    data.origin_utm?.[1] !== 7389264 ||
    data.id !== 'sse80_plateaus.2020.torre_80m' ||
    data.name !== null ||
    data.axes !== 'x=E,y=Z_abs,z=-N' ||
    !Array.isArray(data.ring_xz) ||
    data.ring_xz.length < 3 ||
    data.ring_xz.length > 100 ||
    !data.ring_xz.every((p) => p.length === 2 && p.every(Number.isFinite)) ||
    !Number.isFinite(data.base_abs_m) ||
    !Number.isFinite(data.top_abs_m) ||
    data.top_abs_m <= data.base_abs_m
  )
    throw new Error('Perfil SSE invalido')
  return data
}

export function makeNeighborReference(data: NeighborReference): THREE.Group {
  const group = new THREE.Group()
  group.name = 'Vizinho_SSE_LiDAR2020_APROXIMACAO'
  const shape = new THREE.Shape()
  data.ring_xz.forEach(([x, z], i) => (i ? shape.lineTo(x, -z) : shape.moveTo(x, -z)))
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: data.top_abs_m - data.base_abs_m,
    bevelEnabled: false,
  })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, data.base_abs_m, 0)
  geo.computeBoundingBox()
  const material = new THREE.MeshStandardMaterial({
    color: 0x647782,
    roughness: 0.82,
    metalness: 0.08,
  })
  const mesh = new THREE.Mesh(geo, material)
  mesh.name = data.id
  mesh.userData = { epoch: 2020, status: data.status, method: data.method, facadeSurveyed: false }
  group.add(mesh)
  group.visible = false
  return group
}
