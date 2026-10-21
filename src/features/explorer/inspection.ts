import * as THREE from 'three'

export type TowerSide = 'north' | 'south' | 'east' | 'west'
// Scene coordinates are E, elevation, -N. These are camera positions, not entrances.
export function towerInspectionPose(
  box: THREE.Box3,
  aspect: number,
  fovDegrees: number,
  side: TowerSide,
) {
  if (!['north', 'south', 'east', 'west'].includes(side)) throw new Error('Vista inválida')
  if (
    box.isEmpty() ||
    !Number.isFinite(aspect) ||
    aspect <= 0 ||
    !Number.isFinite(fovDegrees) ||
    fovDegrees <= 0 ||
    fovDegrees >= 179
  )
    throw new Error('Enquadramento inválido')
  const center = box.getCenter(new THREE.Vector3())
  const radius = box.getSize(new THREE.Vector3()).length() / 2
  if (!Number.isFinite(radius) || radius <= 0) throw new Error('Volume inválido')
  const vertical = THREE.MathUtils.degToRad(fovDegrees)
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect)
  const distance = (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.15
  const direction = { north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] }[side]
  return {
    center,
    position: center.clone().add(new THREE.Vector3(...direction).multiplyScalar(distance)),
    distance,
  }
}
