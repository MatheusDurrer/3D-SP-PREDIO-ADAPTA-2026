import * as THREE from 'three'

// Visible framing in owner's entrance reference 8399a6df and arrival photos R15/R20.
// Dimensions follow the EXISTING approximate canopy, not a new survey.
// Grid count and 0.10m section are visual construction hypotheses, NOT measured spacing.
export function makeCanopyFrame(pos: Float32Array): THREE.Group {
  if (pos.length < 24 || !Array.from(pos.slice(0, 24)).every(Number.isFinite))
    throw new Error('Cobertura invalida para caixilharia')
  const corners = [0, 1, 2, 3].map((i) => new THREE.Vector3().fromArray(pos, i * 3))
  const group = new THREE.Group()
  group.name = 'Marquise_caixilharia_APROXIMACAO_NAO_MEDIDA'
  const material = new THREE.MeshStandardMaterial({
    color: 0xc7ceca,
    roughness: 0.5,
    metalness: 0.4,
  })
  const beam = (a: THREE.Vector3, b: THREE.Vector3, name: string) => {
    const vector = b.clone().sub(a)
    const length = vector.length()
    if (!Number.isFinite(length) || length < 0.01) throw new Error('Travessa invalida')
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, length, 0.1), material)
    mesh.position.copy(a).add(b).multiplyScalar(0.5)
    mesh.position.y -= 0.1
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize())
    mesh.name = name
    group.add(mesh)
  }
  for (const [a, b] of [
    [0, 1],
    [1, 3],
    [3, 2],
    [2, 0],
  ])
    beam(corners[a], corners[b], 'Perimetro_aproximado')
  for (const t of [0.2, 0.4, 0.6, 0.8]) {
    beam(
      corners[0].clone().lerp(corners[2], t),
      corners[1].clone().lerp(corners[3], t),
      'Travessa_aproximada',
    )
    beam(
      corners[0].clone().lerp(corners[1], t),
      corners[2].clone().lerp(corners[3], t),
      'Longarina_aproximada',
    )
  }
  group.userData = {
    status: 'VISUAL_GEOMETRY_APPROXIMATION_NOT_SURVEYED',
    source: 'Owner entrance reference 8399a6df; R15/R20 capture 2026-10-23',
    grid: 'VISUAL_HYPOTHESIS_NOT_MEASURED_PANEL_COUNT',
    members: group.children.length,
    faces: group.children.length * 12,
  }
  return group
}
