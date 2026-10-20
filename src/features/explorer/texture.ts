import * as THREE from 'three'
import { sha256Hex } from './ground'

export const TEXTURE_URL = '/scene/ortho-geosampa-2020.webp'
export async function loadGroundTexture(signal: AbortSignal): Promise<THREE.Texture> {
  const response = await fetch(TEXTURE_URL, { cache: 'no-store', signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const raw = await response.arrayBuffer()
  if (
    raw.byteLength !== 15478 ||
    (await sha256Hex(raw)) !== '683f0bee8bcd3d7c3ed5de0c76a0305a5521fb07cfa53f7ec33db6dc7df5530e'
  )
    throw new Error('Integridade da ortofoto divergente')
  if (signal.aborted) throw new Error('Carregamento cancelado')
  const url = URL.createObjectURL(new Blob([raw], { type: 'image/webp' }))
  try {
    const texture = await new THREE.TextureLoader().loadAsync(url)
    if (signal.aborted) {
      texture.dispose()
      throw new Error('Carregamento cancelado')
    }
    // WebGL pixel test: north=v0 must sample image top. flipY=true mirrored N/S.
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
    return texture
  } finally {
    URL.revokeObjectURL(url)
  }
}
