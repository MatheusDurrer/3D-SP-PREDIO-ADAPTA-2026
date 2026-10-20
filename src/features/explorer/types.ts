export interface LidarSource {
  tile: string
  kind: string
  file: string
  sha256: string
  source: string
  epsg: number
  datum: string
}

export interface BuildingFeature {
  id: string
  rings: number[][][]
  h_cadastral_m: number
  base_z_m: number | null
  area_m2: number
  criacao?: string
  atualizacao?: string
  fonte?: string
}

export interface AdaptaSensitivity {
  threshold_m: number
  area_m2: number
  iou_vs_110: number
  centroid_shift_m: number
  hausdorff_vs_110_m: number
}

export interface SampledMeta {
  source_file: string
  source_sha256: string
  source_bytes: number
  method: string
  stride: Record<string, number>
  effective_grid_m: Record<string, number>
  note: string
}

export interface SceneData {
  neighborReference?: import('./neighbor').NeighborReference
  neighborNote?: string
  towerCandidate?: import('./tower').TowerCandidate
  ground?: import('./ground').GroundMesh
  schema: string
  status: string
  gate: string
  epoch: number
  crs: string
  origin_utm: [number, number]
  axes: Record<string, string>
  bbox_m: { size: number[]; utm: number[] }
  units: string
  sampled?: SampledMeta
  source_counts?: Record<string, number>
  provenance: {
    lidar: LidarSource[]
    footprints: { file: string; sha256: string; source: string }
    contour: { file: string; sha256: string; source: string }
  }
  limits: string[]
  counts: Record<string, number>
  groundMode?: 'mesh' | 'points'
  groundFaces?: number
  groundNote?: string
  layers: {
    terrain: { grid_m: number; method: string; points: number[][] }
    roof_points: {
      grid_m: number
      class: number
      method: string
      point_sem_exatidao: boolean
      points: number[][]
    }
    contour_roof_points: {
      grid_m: number
      class: number
      role: string
      point_sem_exatidao: boolean
      points: number[][]
    }
    buildings: { extrusion: string; features: BuildingFeature[] }
    adapta_contour: {
      identity: string
      status: string
      gate: string
      floors: number[]
      centroid_utm: [number, number]
      centroid_wgs84: { lat: number; lng: number }
      sensitivity: AdaptaSensitivity[]
      rings: number[][][]
      use: string
    }
  }
}
