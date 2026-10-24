import * as THREE from 'three'
import { sha256Hex } from './ground'
import { makeCanopyFrame } from './canopyFrame'

// MOD-ENTRANCE-MARQUISE-V1 — marquise/entrada da face oeste (aproximação visual NÃO MÉTRICA).
// Fontes: Street View Fev 2024 (pano yQe1m1csIK-a4Sgn029Bcw, yaw105/−30) + fotos do Tony
// (uploads/8399a6df, e7fb6407) — corroboradas por 2 fontes independentes.
// NÃO é as-built: sem cota, sem spacing comprovado. Posicionada por membership na face
// oeste MEDIDA da torre (x=−25..−21 no dataset próprio), nunca por geocode.
// Transporte: base64 em texto (binário corrompe no canal MCP — lição Solaris/SP3D);
// SHA-256 verificado no cliente antes de usar.

const MARQUISE_URL = '/scene/marquise-v1.b64'
const EXPECTED_SHA256 = 'bf833bbb8e034c7dca822e3fa146feec65e8b10c89ff56cd6449ef1781df1d30'
const EXPECTED_NV = 160
const EXPECTED_NF = 232

export async function loadMarquise(signal: AbortSignal): Promise<THREE.Group> {
  const response = await fetch(MARQUISE_URL, { cache: 'no-store', signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const b64Text = (await response.text()).trim()
  const binary = Uint8Array.from(atob(b64Text), (c) => c.charCodeAt(0))
  if ((await sha256Hex(binary)) !== EXPECTED_SHA256)
    throw new Error('Integridade da marquise divergente')
  const raw = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength)
  const view = new DataView(raw)
  if (new TextDecoder().decode(new Uint8Array(raw, 0, 8)) !== 'SP3DW001')
    throw new Error('Formato da marquise invalido')
  const nV = view.getUint16(8, true)
  const nF = view.getUint16(10, true)
  if (nV !== EXPECTED_NV || nF !== EXPECTED_NF || raw.byteLength !== 12 + nV * 12 + nF * 6)
    throw new Error('Contagens da marquise invalidas')
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
  const group = new THREE.Group()
  let renderedFaces = 0
  let discardedDegenerateFaces = 0
  group.name = 'Marquise_entrada_APROXIMACAO_VISUAL_NAO_METRICA'

  // Cobertura transparente = primeiros 20 vértices (8 da cobertura + 12 das colunas/escada são opacos)
  // Estrutura: separar por material via faixas de índice conhecidas do gerador:
  //   cobertura: faces 0..11 (12 triângulos) — vértices 0..7
  //   colunas:   faces 12..51 (40 triângulos) — vértices 8..39
  //   escada:    faces 52..111 (60 triângulos) — vértices 40..79
  //   guarda-corpos: faces 112..231 (120 triângulos) — vértices 80..159
  const makeSubset = (
    startFace: number,
    countFace: number,
    material: THREE.Material,
    name: string,
  ) => {
    const idx: number[] = []
    const a = new THREE.Vector3()
    const b = new THREE.Vector3()
    const c = new THREE.Vector3()
    for (let f = startFace; f < startFace + countFace; f++) {
      const ia = indices[3 * f],
        ib = indices[3 * f + 1],
        ic = indices[3 * f + 2]
      a.fromArray(pos, ia * 3)
      b.fromArray(pos, ib * 3).sub(a)
      c.fromArray(pos, ic * 3).sub(a)
      if (b.cross(c).lengthSq() <= 1e-12) {
        discardedDegenerateFaces++
        continue
      }
      idx.push(ia, ib, ic)
    }
    const indexed = new THREE.BufferGeometry()
    indexed.setAttribute('position', new THREE.BufferAttribute(pos.slice(), 3))
    indexed.setIndex(idx)
    // Independent triangle vertices retain hard architectural edges. No spatial changes.
    const geo = indexed.toNonIndexed()
    indexed.dispose()
    geo.computeVertexNormals()
    renderedFaces += idx.length / 3
    const mesh = new THREE.Mesh(geo, material)
    mesh.name = name
    return mesh
  }

  const canopy = makeSubset(
    0,
    12,
    new THREE.MeshPhysicalMaterial({
      color: 0xdfe9f2,
      transparent: true,
      opacity: 0.35,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.6,
      side: THREE.DoubleSide,
    }),
    'Marquise_cobertura_transparente',
  )
  const columns = makeSubset(
    12,
    40,
    new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.55, metalness: 0.05 }),
    'Marquise_colunas_brancas',
  )
  const stairs = makeSubset(
    52,
    60,
    new THREE.MeshStandardMaterial({ color: 0xcfd2cc, roughness: 0.8, metalness: 0.0 }),
    'Marquise_escadaria',
  )
  const rails = makeSubset(
    112,
    120,
    new THREE.MeshStandardMaterial({ color: 0xd8dad6, roughness: 0.6, metalness: 0.1 }),
    'Marquise_guarda_corpos',
  )
  const frame = makeCanopyFrame(pos)
  group.add(canopy, columns, stairs, rails, frame)
  group.userData = {
    status: 'APROXIMACAO_VISUAL_NAO_METRICA',
    epoch: 'SV2024+fotos_proprietarias',
    metric: false,
    vertices: nV,
    sourceFaces: nF,
    faces: renderedFaces + Number(frame.userData.faces),
    baseFaces: renderedFaces,
    framingMembers: frame.children.length,
    discardedDegenerateFaces,
  }
  group.visible = false
  return group
}
