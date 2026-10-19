export const DENSE_SHA256 = 'b85c52c0be5fce20fe03af6529749cc5584076e87fe40c8f8f597d1c920c7b08'
export const DENSE_COUNTS = [2032, 4468, 1008] as const

/** Decode only measured centimeter coordinates. Reject malformed/trailing input. */
export function decodeDense(raw: Uint8Array): number[][][] {
  if (
    raw.length < 16 ||
    raw.length > 200000 ||
    raw[0] !== 83 ||
    raw[1] !== 80 ||
    raw[2] !== 68 ||
    raw[3] !== 50
  )
    throw new Error('Formato de detalhe inválido')
  let offset = 4
  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength)
  const result: number[][][] = []
  for (const expected of DENSE_COUNTS) {
    if (offset + 4 > raw.length) throw new Error('Cabeçalho truncado')
    const count = view.getUint32(offset, true)
    offset += 4
    if (count !== expected) throw new Error('Contagem de detalhe inválida')
    const previous = [0, 0, 0]
    const points: number[][] = []
    for (let n = 0; n < count; n++) {
      const point: number[] = []
      for (let axis = 0; axis < 3; axis++) {
        let value = 0
        let factor = 1
        let completed = false
        for (let k = 0; k < 5; k++) {
          if (offset >= raw.length) throw new Error('Coordenada truncada')
          const byte = raw[offset++]
          value += (byte & 127) * factor
          if (byte < 128) {
            completed = true
            break
          }
          factor *= 128
        }
        if (!completed) throw new Error('Coordenada inválida')
        const delta = value % 2 ? -(value + 1) / 2 : value / 2
        previous[axis] += delta
        const coordinate = previous[axis] / 100
        if (!Number.isFinite(coordinate) || Math.abs(coordinate) > 10000)
          throw new Error('Coordenada fora do limite')
        point.push(coordinate)
      }
      points.push(point)
    }
    result.push(points)
  }
  if (offset !== raw.length) throw new Error('Dados excedentes no detalhe')
  return result
}

export async function readDense(packed: ArrayBuffer): Promise<number[][][]> {
  if (packed.byteLength !== 33305) throw new Error('Tamanho do detalhe inválido')
  const digest = await crypto.subtle.digest('SHA-256', packed)
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
  if (hash !== DENSE_SHA256) throw new Error('Integridade do detalhe inválida')
  if (typeof DecompressionStream === 'undefined')
    throw new Error('Este navegador não suporta o detalhe comprimido')
  const stream = new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))
  const raw = new Uint8Array(await new Response(stream).arrayBuffer())
  return decodeDense(raw)
}
