import * as THREE from 'three'
import { sha256Hex } from './ground'

export async function loadWestRoof(signal: AbortSignal): Promise<THREE.Mesh> {
  const response = await fetch('/scene/west-roof-2020.bin', { cache: 'no-store', signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const raw = await response.arrayBuffer()
  if (
    raw.byteLength !== 3810 ||
    (await sha256Hex(raw)) !== '61f943c7063140a48527757c2e49ea630b8d76b1c56ba9c968ed028b4bbc7c8f'
  )
    throw new Error('Integridade do telhado oeste divergente')
  if (new TextDecoder().decode(new Uint8Array(raw, 0, 8)) !== 'SP3DW001')
    throw new Error('Formato do telhado oeste invalido')
  const view = new DataView(raw)
  const nV = view.getUint16(8, true)
  const nF = view.getUint16(10, true)
  if (nV !== 177 || nF !== 279 || raw.byteLength !== 12 + nV * 12 + nF * 6)
    throw new Error('Contagens do telhado oeste invalidas')
  const pos = new Float32Array(nV * 3)
  let offset = 12
  for (let i = 0; i < pos.length; i++, offset += 4) {
    pos[i] = view.getFloat32(offset, true)
    if (!Number.isFinite(pos[i])) throw new Error('Coordenada invalida')
  }
  const indices = new Uint16Array(nF * 3)
  for (let i = 0; i < indices.length; i++, offset += 2) {
    indices[i] = view.getUint16(offset, true)
    if (indices[i] >= nV) throw new Error('Indice invalido')
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeVertexNormals()
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0x42d9ca, side: THREE.DoubleSide }),
  )
  mesh.name = 'Telhado_oeste_observado_2020_NAO_AS_BUILT_2025'
  mesh.userData = { epoch: 2020, vertices: nV, faces: nF, measuredReturns: true, walls: false }
  mesh.visible = false
  return mesh
}
