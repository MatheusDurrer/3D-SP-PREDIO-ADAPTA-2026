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

// R24 (31/10) — material posterior da torre. APENAS material: buffers, índices e
// geometria do torre_corpo permanecem intactos. Hipótese de aplicação: face
// posterior = lado oposto à marquise (face oeste medida, x=−25..−21), ou seja
// normais +x (leste) — azimute NÃO levantado, rotulado como hipótese.
// Amostras medidas no ROI do owner (captura 23/10, mediana 400 px/zona):
// vidro posterior #727172, montantes escuros #242a2a (NÃO modelados — sem
// bandas/pavimentos procedurais), reflexos #dee0e2. As faixas de sacadas da
// captura permanecem LACUNA não modelada, por restrição do lote.
export function applyRearGlassTint(material: THREE.MeshPhysicalMaterial) {
  const rearGlass = new THREE.Color('#727172')
  const rearRoughnessDelta = 0.16
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      `#include <normal_fragment_begin>
      // SP3D R24: rear glass tint only, east hypothesis.
      {
        vec3 sp3dWorldN = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
        float sp3dRear = smoothstep(0.25, 0.55, sp3dWorldN.x);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(${rearGlass.r.toFixed(4)}, ${rearGlass.g.toFixed(4)}, ${rearGlass.b.toFixed(4)}), sp3dRear * 0.85);
        roughnessFactor = mix(roughnessFactor, clamp(roughnessFactor + ${rearRoughnessDelta}, 0.0, 1.0), sp3dRear);
      }`,
    )
  }
  material.userData = {
    ...material.userData,
    rearFacade: {
      status: 'R24_MATERIAL_ONLY_GEOMETRY_UNTOUCHED',
      azimuth: 'HYPOTHESIS_EAST_OPPOSITE_WEST_MARQUISE_NOT_SURVEYED',
      samples: 'ROI owner 23/10: glass #727172, mullions #242a2a (not modeled), highlights #dee0e2',
      bands: 'NOT_MODELED_LACUNA_NO_PROCEDURAL_FLOORS',
    },
  }
  return material
}
