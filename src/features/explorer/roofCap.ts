import * as THREE from 'three'

// Remove only the synthetic horizontal upper cap; retain every position/normal/UV.
export function removeSyntheticTopCap(mesh: THREE.Mesh, top: number) {
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
