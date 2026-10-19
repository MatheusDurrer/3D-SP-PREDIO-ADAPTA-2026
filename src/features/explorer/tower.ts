import * as THREE from 'three'

export interface TowerCandidate {
  schema: string
  status: string
  origin_utm: number[]
  source_glb_sha256: string
  profiles: { name: string; ring: number[][]; base: number; top: number }[]
  bands: { spacing_m: number; thickness_m: number; scale: number; status: string }
}

export function makeTowerCandidate(data: TowerCandidate): THREE.Group {
  if (data.schema !== 'sp3d_tower_candidate/1' || data.profiles.length !== 3)
    throw new Error('Modelo candidato inválido')
  const group = new THREE.Group()
  group.name = 'Adapta_CANDIDATE_NOT_VALIDATED'
  const colors = [0x354f6b, 0x415b73, 0x4e6478]
  data.profiles.forEach((profile, index) => {
    if (
      !Number.isFinite(profile.base) ||
      !Number.isFinite(profile.top) ||
      profile.top <= profile.base ||
      profile.ring.length < 3 ||
      !profile.ring.every((p) => p.length === 2 && p.every(Number.isFinite))
    )
      throw new Error('Perfil candidato inválido')
    const shape = new THREE.Shape()
    profile.ring.forEach((p, i) => {
      if (i) shape.lineTo(p[0], -p[1])
      else shape.moveTo(p[0], -p[1])
    })
    shape.closePath()
    const height = profile.top - profile.base
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false })
    geometry.rotateX(-Math.PI / 2)
    geometry.translate(0, profile.base, 0)
    const material = new THREE.MeshStandardMaterial({
      color: colors[index],
      metalness: 0.45,
      roughness: 0.38,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = profile.name
    group.add(mesh)
    if (index === 0) {
      const positions: number[] = []
      for (
        let y = profile.base + data.bands.spacing_m;
        y < profile.top - data.bands.thickness_m;
        y += data.bands.spacing_m
      ) {
        for (let i = 0; i < profile.ring.length; i++) {
          const a = profile.ring[i],
            b = profile.ring[(i + 1) % profile.ring.length]
          positions.push(a[0], y, a[1], b[0], y, b[1])
        }
      }
      const joints = new THREE.LineSegments(
        new THREE.BufferGeometry().setAttribute(
          'position',
          new THREE.Float32BufferAttribute(positions, 3),
        ),
        new THREE.LineBasicMaterial({ color: 0xc7ced4, transparent: true, opacity: 0.72 }),
      )
      joints.name = 'juntas_procedurais_nao_levantadas'
      group.add(joints)
    }
  })
  return group
}
