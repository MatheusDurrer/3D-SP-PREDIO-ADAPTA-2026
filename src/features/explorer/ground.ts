// SP3D 66675 — decodificador da malha do solo (ground-mesh-v1.bin), sem textura.
// Codec provado 1:1 em work/sp3d_ground_transfer/reconstruct_test.mjs (20/10):
// nV 12173, nF 22431, faceMiss 0, posMax 0.005 m, uvMax 1.5e-6 vs GLB validado.
// Conectividade = algoritmo ATUAL (componentes 4-conectadas), não o antigo (FAIL).
// Header: magic 'SP3DGRND' | u8 ver=1 | u16 nV | u16 nF | i32 zBase(cm) | u8 reserved
// Célula: varint gap-key | zigzag dE(mm) | zigzag d(-N)(mm) | zigzag dz(0.1mm)
// Centro: cx = gx*3-180+1.5 ; cz = gz*3-180+1.5 (residuais em espaço -N direto)
// z: primeiro valor absoluto /1000, depois delta acumulado /1000
// UV 1:1 com GLB: u = (x+180)/360 ; v = (z+180)/360 (ambas DIRETAS, sem espelho)
// Saída: x=Este, y=Z absoluto (altura), z=-Norte. Buracos/ilhotas preservados.

export const GROUND_MESH_URL = '/scene/ground-mesh-v1.bin'
export const EXPECTED_GROUND_SHA256 =
  '6cc149e3c903a6f35c29da7c173ae5e5fad6b70181b7d9fbbb8bc9f9fb93b22b'

export interface GroundMesh {
  positions: Float32Array
  uvs: Float32Array
  indices: Uint32Array
  nV: number
  nF: number
  flipped: number
}

export async function sha256Hex(buf: ArrayBuffer | Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 indisponível (contexto não seguro)')
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function decodeGroundMesh(raw: Uint8Array): GroundMesh {
  if (raw.length < 17 || raw.length > 2_000_000)
    throw new Error(`tamanho fora dos limites: ${raw.length}`)
  let o = 0
  const u8 = () => {
    if (o >= raw.length) throw new Error('fim inesperado (u8)')
    return raw[o++]
  }
  const u16 = () => {
    if (o + 2 > raw.length) throw new Error('fim inesperado (u16)')
    const v = raw[o] | (raw[o + 1] << 8)
    o += 2
    return v
  }
  const i32 = () => {
    if (o + 4 > raw.length) throw new Error('fim inesperado (i32)')
    const v = raw[o] | (raw[o + 1] << 8) | (raw[o + 2] << 16) | (raw[o + 3] << 24)
    o += 4
    return v
  }
  const varint = () => {
    let x = 0,
      sh = 0,
      b
    do {
      if (o >= raw.length) throw new Error('fim inesperado (varint)')
      b = raw[o++]
      x |= (b & 0x7f) << sh
      sh += 7
    } while (b & 0x80)
    return x >>> 0
  }
  const res = () => {
    const x = varint()
    return (x >> 1) ^ -(x & 1)
  }
  const magic = String.fromCharCode(...raw.slice(0, 8))
  if (magic !== 'SP3DGRND') throw new Error(`magic inválido: ${magic}`)
  o = 8
  const ver = u8()
  if (ver !== 1) throw new Error(`versão não suportada: ${ver}`)
  const nV = u16(),
    nF = u16()
  i32() // zBase (cm) — z chega absoluto/acumulado nas células
  u8() // reserved
  if (nV === 0 || nV > 65535 || nF === 0 || nF > 40000)
    throw new Error(`contagens fora dos limites: ${nV}/${nF}`)
  if (raw.length < 17 + nV * 4 || raw.length > 17 + nV * 20)
    throw new Error(`tamanho incompatível com nV=${nV}`)

  const keys = new Uint32Array(nV)
  const dxs = new Int32Array(nV)
  const dzs = new Int32Array(nV)
  const zms = new Float64Array(nV)
  let prevKey = 0
  let prevZ = 0
  for (let i = 0; i < nV; i++) {
    const gap = varint()
    const k = i === 0 ? gap : prevKey + gap
    keys[i] = k
    prevKey = k
    dxs[i] = res()
    dzs[i] = res()
    const d = res()
    const z = i === 0 ? d / 1000 : prevZ + d / 1000
    zms[i] = z
    prevZ = z
  }
  if (o !== raw.length) throw new Error(`bytes excedentes: ${raw.length - o}`)

  const positions = new Float32Array(nV * 3)
  const uvs = new Float32Array(nV * 2)
  for (let i = 0; i < nV; i++) {
    const gx = Math.floor(keys[i] / 100000)
    const gz = keys[i] % 100000
    const x = gx * 3 - 180 + 1.5 + dxs[i] / 1000
    const z = gz * 3 - 180 + 1.5 + dzs[i] / 1000
    positions[3 * i] = x
    positions[3 * i + 1] = zms[i]
    positions[3 * i + 2] = z
    uvs[2 * i] = (x + 180) / 360
    uvs[2 * i + 1] = (z + 180) / 360
  }

  // Componentes 4-conectadas no espaço key (buracos/ilhotas respeitados) —
  // réplica exata do codec provado; sem "melhorias" que mudem faces.
  const idx = new Map<number, number>()
  for (let i = 0; i < nV; i++) idx.set(keys[i], i)
  const comp = new Map<number, number>()
  let cid = 0
  for (let i = 0; i < nV; i++) {
    const k0 = keys[i]
    if (comp.has(k0)) continue
    cid++
    const q: number[] = [k0]
    comp.set(k0, cid)
    while (q.length) {
      const c = q.pop() as number
      const gx = Math.floor(c / 100000)
      const gz = c % 100000
      for (const [nx, ny] of [
        [gx + 1, gz],
        [gx - 1, gz],
        [gx, gz + 1],
        [gx, gz - 1],
      ]) {
        const n = nx * 100000 + ny
        if (idx.has(n) && !comp.has(n)) {
          comp.set(n, cid)
          q.push(n)
        }
      }
    }
  }

  const faces: number[] = []
  for (let i = 0; i < nV; i++) {
    const k = keys[i]
    const gx = Math.floor(k / 100000)
    const gz = k % 100000
    const a = idx.get(k) as number
    const pairs: Array<[number, number]> = [
      [(gx + 1) * 100000 + gz, (gx + 1) * 100000 + (gz - 1)],
      [gx * 100000 + (gz - 1), (gx + 1) * 100000 + (gz - 1)],
    ]
    for (const [n1, n2] of pairs) {
      const ka = idx.get(n1)
      const kb = idx.get(n2)
      if (ka === undefined || kb === undefined) continue
      if (comp.get(k) !== comp.get(n1) || comp.get(k) !== comp.get(n2)) continue
      faces.push(a, ka, kb)
    }
  }
  if (faces.length / 3 !== nF) throw new Error(`faces ${faces.length / 3} != ${nF}`)

  const nyUp = (a: number, b: number, c: number): number => {
    const ax = positions[3 * a],
      az = positions[3 * a + 2]
    const bx = positions[3 * b],
      bz = positions[3 * b + 2]
    const cx = positions[3 * c],
      cz = positions[3 * c + 2]
    return (bz - az) * (cx - ax) - (bx - ax) * (cz - az)
  }
  let flipped = 0
  for (let f = 0; f < faces.length; f += 3) {
    if (nyUp(faces[f], faces[f + 1], faces[f + 2]) < 0) {
      const t = faces[f]
      faces[f] = faces[f + 2]
      faces[f + 2] = t
      flipped++
    }
    if (nyUp(faces[f], faces[f + 1], faces[f + 2]) <= 0)
      throw new Error('normal não-Y+ após winding')
  }

  return {
    positions,
    uvs,
    indices: new Uint32Array(faces),
    nV,
    nF,
    flipped,
  }
}
