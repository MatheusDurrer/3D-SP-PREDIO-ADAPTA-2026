import * as THREE from 'three'

// Remove only the synthetic horizontal upper cap; retain every position/normal/UV.
export function removeSyntheticTopCap(
  mesh: THREE.Mesh,
  top: number,
  replacement: THREE.BufferGeometry,
) {
  if (!Number.isFinite(top)) throw new Error('Topo inválido')
  const observed = replacement.getAttribute('position')
  const observedIndex = replacement.index
  if (
    !observed ||
    observed.count < 3 ||
    !observedIndex ||
    observedIndex.count < 3 ||
    observedIndex.count % 3 !== 0
  )
    throw new Error('Superfície observada inválida')
  mesh.geometry.computeBoundingBox()
  const bounds = mesh.geometry.boundingBox
  if (!bounds) throw new Error('Volume da torre indisponível')
  for (let i = 0; i < observed.count; i++) {
    const point = new THREE.Vector3().fromBufferAttribute(observed, i)
    if (
      ![point.x, point.y, point.z].every(Number.isFinite) ||
      point.x < bounds.min.x - 0.01 ||
      point.x > bounds.max.x + 0.01 ||
      point.z < bounds.min.z - 0.01 ||
      point.z > bounds.max.z + 0.01 ||
      point.y < top - 5 ||
      point.y > top + 0.1
    )
      throw new Error('Superfície fora do volume esperado')
  }
  for (let i = 0; i < observedIndex.count; i++) {
    const index = observedIndex.getX(i)
    if (!Number.isInteger(index) || index < 0 || index >= observed.count)
      throw new Error('Índice observado inválido')
  }
  const geometry = mesh.geometry
  const positions = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')
  const oldIndex = geometry.index
  const count = oldIndex ? oldIndex.count : positions.count
  const kept: number[] = []
  let removed = 0
  for (let i = 0; i < count; i += 3) {
    const ids = [0, 1, 2].map((j) => (oldIndex ? oldIndex.getX(i + j) : i + j))
    const upper = ids.every(
      (id) => Math.abs(positions.getY(id) - top) < 0.002 && normals.getY(id) > 0.99,
    )
    if (upper) removed += 1
    else kept.push(...ids)
  }
  if (!removed) throw new Error('Tampa superior não identificada')
  geometry.setIndex(kept)
  geometry.clearGroups()
  mesh.userData.topSurface = 'OBSERVED_ROOF_2020_WITH_UNMODELED_GAPS'
  mesh.userData.removedSyntheticCapTriangles = removed
  return removed
}
