import * as THREE from 'three'
import { sha256Hex } from './ground'

export async function loadObservedRoof(signal: AbortSignal): Promise<THREE.Mesh> {
  const response = await fetch('/scene/roof-observed-2020.bin', { cache: 'no-store', signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const raw = await response.arrayBuffer()
  if (
    raw.byteLength !== 10764 ||
    (await sha256Hex(raw)) !== 'd79e2bf1708b1dfb558093a6ae69343c49a4b0148ac71e86605bd8da0acdf9fe'
  )
    throw new Error('Integridade do telhado divergente')
  const bytes = new Uint8Array(raw)
  if (new TextDecoder().decode(bytes.slice(0, 8)) !== 'SP3DRF01')
    throw new Error('Formato do telhado invalido')
  const view = new DataView(raw)
  const nV = view.getUint16(8, true),
    nF = view.getUint16(10, true)
  if (nV !== 703 || nF !== 1089 || raw.byteLength !== 12 + nV * 6 + nF * 6)
    throw new Error('Contagens do telhado invalidas')
  const pos = new Float32Array(nV * 3)
  let offset = 12
  for (let i = 0; i < nV; i++) {
    pos[3 * i] = view.getInt16(offset, true) / 1000
    pos[3 * i + 1] = 860 + view.getInt16(offset + 2, true) / 1000
    pos[3 * i + 2] = view.getInt16(offset + 4, true) / 1000
    offset += 6
  }
  const indices = new Uint16Array(nF * 3)
  for (let i = 0; i < indices.length; i++) {
    const index = view.getUint16(offset, true)
    if (index >= nV) throw new Error('Indice do telhado invalido')
    indices[i] = index
    offset += 2
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setIndex(new THREE.BufferAttribute(indices, 1))
  const colors = new Float32Array(nV * 3)
  const color = new THREE.Color()
  for (let i = 0; i < nV; i++) {
    color.setHSL(
      0.6 - THREE.MathUtils.clamp((pos[3 * i + 1] - 861.5) / 1.5, 0, 1) * 0.52,
      0.65,
      0.55,
    )
    colors.set([color.r, color.g, color.b], i * 3)
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  )
  mesh.name = 'Telhado_observado_LiDAR2020_NAO_AS_BUILT_2025'
  mesh.userData = {
    epoch: 2020,
    vertices: nV,
    faces: nF,
    method:
      'Observed returns per 1m cell; adjacent cells only; edge<=2.3m, dZ<=0.25m. Gaps are not inferred voids. No walls inferred.',
  }
  mesh.visible = false
  return mesh
}
