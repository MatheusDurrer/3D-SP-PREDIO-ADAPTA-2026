import * as THREE from 'three'

// Author-created lighting, not imagery of the building or its surroundings.
export function createFacadeEnvironment(renderer: THREE.WebGLRenderer) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Ambiente da fachada indisponível')
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#aecdf0')
  gradient.addColorStop(0.5, '#e6eef6')
  gradient.addColorStop(0.62, '#8a948c')
  gradient.addColorStop(1, '#4a4f4a')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.mapping = THREE.EquirectangularReflectionMapping
  const generator = new THREE.PMREMGenerator(renderer)
  try {
    return generator.fromEquirectangular(texture)
  } finally {
    generator.dispose()
    texture.dispose()
  }
}

// Visual approximation only: no facade dimensions or geometry are generated.
export function applyTowerGlass(group: THREE.Group, environment: THREE.Texture) {
  const tower = group.getObjectByName('torre_corpo')
  if (!(tower instanceof THREE.Mesh)) throw new Error('Corpo da torre indisponível')
  const previous = tower.material
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x24384f,
    metalness: 0.7,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMap: environment,
    envMapIntensity: 3,
  })
  material.name = 'adapta-glass-visual-approximation'
  material.userData = {
    status: 'VISUAL_APPROXIMATION_NOT_PHYSICAL_MEASURED',
    reference: 'Owner photos and authorized Street View 2024 visual reference',
    geometryUntouched: true,
  }
  tower.material = material
  if (Array.isArray(previous)) previous.forEach((item) => item.dispose())
  else previous.dispose()
  return material
}
