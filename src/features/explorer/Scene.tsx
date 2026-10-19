import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { BuildingFeature, SceneData } from './types'
import { makeTowerCandidate } from './tower'

export type LayerKey = 'terrain' | 'roof' | 'buildings' | 'outline'

export interface SceneApi {
  setLayerVisible(k: LayerKey, v: boolean): void
  setPointSize(px: number): void
  setAutoRotate(on: boolean): void
  resetView(): void
  setOverview(on: boolean): void
}

interface Props {
  data: SceneData
  pointSize: number
  layers: Record<LayerKey, boolean>
  overview: boolean
  autoRotate: boolean
  reducedMotion: boolean
}

const BG = 0x0b0f14

function heightColor(t: number, stops: [number, number, number]): THREE.Color {
  const a = new THREE.Color(stops[0])
  const b = new THREE.Color(stops[1])
  const c = new THREE.Color(stops[2])
  if (t < 0.5) return a.lerp(b, t * 2)
  return b.lerp(c, (t - 0.5) * 2)
}

function makeMarkerTexture(): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = 320
  cv.height = 84
  const ctx = cv.getContext('2d')!
  ctx.fillStyle = 'rgba(13,18,26,0.88)'
  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 3
  const r = 14
  ctx.beginPath()
  ctx.roundRect(3, 3, cv.width - 6, cv.height - 6, r)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#fbbf24'
  ctx.font = '600 26px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('ADAPTA · NORTE', cv.width / 2, cv.height / 2 - 12, cv.width - 24)
  ctx.fillStyle = '#cbd5e1'
  ctx.font = '500 18px system-ui, sans-serif'
  ctx.fillText('precisão não validada', cv.width / 2, cv.height / 2 + 13)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function webglAvailable(): boolean {
  try {
    const cv = document.createElement('canvas')
    return !!(cv.getContext('webgl2') || cv.getContext('webgl'))
  } catch {
    return false
  }
}

export default function SceneCanvas({
  data,
  pointSize,
  layers,
  overview,
  autoRotate,
  reducedMotion,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<SceneApi | null>(null)
  const [glError, setGlError] = useState<string | null>(null)

  // ---- inicialização única da cena --------------------------------------
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (!webglAvailable()) {
      setGlError('WebGL indisponível neste navegador — a cena 3D não pode ser renderizada.')
      return
    }

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    } catch (e) {
      setGlError('Falha ao criar contexto WebGL: ' + String(e instanceof Error ? e.message : e))
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.setClearColor(BG, 1)
    host.appendChild(renderer.domElement)
    renderer.domElement.tabIndex = 0
    renderer.domElement.setAttribute(
      'aria-label',
      'Entorno Adapta em 3D: arraste para girar, use rolagem ou pinça para zoom',
    )

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BG)
    scene.fog = new THREE.Fog(BG, 700, 2200)

    const camera = new THREE.PerspectiveCamera(50, host.clientWidth / host.clientHeight, 0.5, 5000)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.maxPolarAngle = Math.PI / 2 - 0.02
    controls.minDistance = 20
    controls.maxDistance = 1600

    scene.add(new THREE.HemisphereLight(0x9db4d6, 0x1a2230, 0.95))
    const dir = new THREE.DirectionalLight(0xffffff, 1.15)
    dir.position.set(220, 420, 160)
    scene.add(dir)

    const group = new THREE.Group()
    scene.add(group)

    // ---- terreno: pontos MDT medidos, sem interpolação da amostra irregular ---
    const terrainPts = data.layers.terrain.points
    const tGeo = new THREE.BufferGeometry()
    const tPos: number[] = []
    const tCol: number[] = []
    let tMin = Infinity
    let tMax = -Infinity
    for (const p of terrainPts) {
      tMin = Math.min(tMin, p[1])
      tMax = Math.max(tMax, p[1])
    }
    for (const p of terrainPts) tPos.push(p[0], p[1], p[2])
    for (const p of terrainPts) {
      const t = (p[1] - tMin) / Math.max(tMax - tMin, 1e-6)
      const c = heightColor(t, [0x14532d, 0x65a30d, 0xfde047])
      tCol.push(c.r, c.g, c.b)
    }
    tGeo.setAttribute('position', new THREE.Float32BufferAttribute(tPos, 3))
    tGeo.setAttribute('color', new THREE.Float32BufferAttribute(tCol, 3))

    // Render only measured positions, without interpolating missing terrain.
    tGeo.setIndex(null)
    const terrainMaterial = new THREE.PointsMaterial({
      vertexColors: true,
      size: pointSize,
      sizeAttenuation: false,
    })
    const terrainMesh = new THREE.Points(tGeo, terrainMaterial)
    group.add(terrainMesh)

    // ---- pontos de telhado LiDAR class6 (cor por altura) ------------------
    const roofPts = data.layers.roof_points.points
    const rGeo = new THREE.BufferGeometry()
    const rPos: number[] = []
    const rCol: number[] = []
    let rMin = Infinity
    let rMax = -Infinity
    for (const p of roofPts) {
      rMin = Math.min(rMin, p[1])
      rMax = Math.max(rMax, p[1])
    }
    for (const p of roofPts) {
      rPos.push(p[0], p[1], p[2])
      const t = (p[1] - rMin) / Math.max(rMax - rMin, 1e-6)
      const c = heightColor(t, [0x1d4ed8, 0x22d3ee, 0xfde047])
      rCol.push(c.r, c.g, c.b)
    }
    rGeo.setAttribute('position', new THREE.Float32BufferAttribute(rPos, 3))
    rGeo.setAttribute('color', new THREE.Float32BufferAttribute(rCol, 3))
    const roofMat = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: false,
    })
    const roofCloud = new THREE.Points(rGeo, roofMat)
    group.add(roofCloud)

    // ---- contorno candidato NORTE (pontos amarelos) ------------------------
    const cPts = data.layers.contour_roof_points.points
    const cGeo = new THREE.BufferGeometry()
    const cPos: number[] = []
    for (const p of cPts) cPos.push(p[0], p[1], p[2])
    cGeo.setAttribute('position', new THREE.Float32BufferAttribute(cPos, 3))
    const contourMat = new THREE.PointsMaterial({
      size: pointSize * 1.7,
      color: 0xfbbf24,
      sizeAttenuation: false,
    })
    const contourCloud = new THREE.Points(cGeo, contourMat)
    group.add(contourCloud)

    // ---- prédios cadastrais extrudados (edificacao_v3) --------------------
    const feats: BuildingFeature[] = data.layers.buildings.features
    const bMat = new THREE.MeshStandardMaterial({
      color: 0x3f4a5a,
      roughness: 0.85,
      transparent: true,
      opacity: 0.92,
      flatShading: true,
    })
    // Mediana apenas para o início visual do marcador; nunca como base de prédio.
    const tSorted = terrainPts.map((p) => p[1]).sort((a, b) => a - b)
    const tMedian = tSorted[Math.floor(tSorted.length / 2)] ?? tMin
    const bGroup = new THREE.Group()
    for (const f of feats) {
      const ring = f.rings[0]
      if (!ring || ring.length < 3) continue
      const shape = new THREE.Shape()
      shape.moveTo(ring[0][0], ring[0][1])
      for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], ring[i][1])
      const h = f.h_cadastral_m
      const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false })
      geo.rotateX(Math.PI / 2) // (x, y_shape, z_extr) -> (x, -z_extr, y_shape)
      geo.translate(0, h, 0) // base em y=0 local
      const base = f.base_z_m
      if (base == null) {
        geo.dispose()
        continue
      } // Nunca inventar suporte de terreno ausente.
      geo.translate(0, base, 0)
      bGroup.add(new THREE.Mesh(geo, bMat))
    }
    group.add(bGroup)
    host.dataset.buildingCount = String(bGroup.children.length)
    host.dataset.terrainCount = String(terrainPts.length)
    host.dataset.roofCount = String(roofPts.length)
    host.dataset.contourCount = String(cPts.length)

    // ---- highlight Adapta: outline pulsante + marcador ---------------------
    const adapta = data.layers.adapta_contour
    const cSorted = cPts.map((p) => p[1]).sort((a, b) => a - b)
    const contourMedian = cSorted[Math.floor(cSorted.length / 2)] ?? rMax
    const outlineGeo = new THREE.BufferGeometry()
    const ring = adapta.rings[0] ?? []
    const oPos: number[] = []
    for (const pt of ring) oPos.push(pt[0], contourMedian, pt[1])
    outlineGeo.setAttribute('position', new THREE.Float32BufferAttribute(oPos, 3))
    const outlineMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
    })
    const outline = new THREE.LineLoop(outlineGeo, outlineMat)
    group.add(outline)

    const centroid = adapta.centroid_utm // [e, n] absolutos; origin = centroid -> local (0,0)
    const markerTex = makeMarkerTexture()
    const markerMat = new THREE.SpriteMaterial({
      map: markerTex,
      transparent: true,
      depthTest: false,
    })
    const marker = new THREE.Sprite(markerMat)
    marker.scale.set(30, 7.9, 1) // reduzido: legível de perto, sem dominar a vista
    marker.position.set(0, contourMedian + 14, 0)
    group.add(marker)
    host.dataset.focusMode = 'adapta'
    host.dataset.fitRadiusM = ''
    host.dataset.fitTarget = ''

    const pinGeo = new THREE.BufferGeometry()
    pinGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([0, tMedian, 0, 0, contourMedian, 0], 3),
    )
    const pin = new THREE.Line(
      pinGeo,
      new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.55 }),
    )
    group.add(pin)
    let candidateTower: THREE.Group | null = null
    if (data.towerCandidate) {
      candidateTower = makeTowerCandidate(data.towerCandidate)
      group.add(candidateTower)
      host.dataset.towerCandidate = 'true'
      host.dataset.towerMeshes = String(candidateTower.children.length)
    } else host.dataset.towerCandidate = 'false'

    // ---- fit de viewport (aspect-aware) ------------------------------------
    const fitView = (topDown = false) => {
      const box = new THREE.Box3().setFromObject(group)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const radius = Math.max(size.length() * 0.5, 50)
      const fov = (camera.fov * Math.PI) / 180
      // Aspect-aware: o menor dos FOVs (vertical vs horizontal) rege a distância —
      // em retrato (aspect < 1) o FOV horizontal é mais estreito e o fit antigo exagerava.
      const aspect = Math.max(camera.aspect, 0.01)
      const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect)
      const minFov = Math.min(fov, hFov)
      const dist = (radius / Math.sin(minFov / 2)) * 0.92
      if (dist > controls.maxDistance) controls.maxDistance = dist * 1.05
      camera.near = Math.max(dist / 200, 0.1)
      camera.far = dist * 12
      camera.updateProjectionMatrix()
      if (topDown) {
        camera.position.set(center.x + 0.02, center.y + dist, center.z + 0.02)
      } else {
        const dirV = new THREE.Vector3(0.62, 0.42, 0.78).normalize()
        camera.position.copy(center).add(dirV.multiplyScalar(dist))
      }
      controls.target.copy(center)
      controls.update()
      host.dataset.viewMode = topDown ? 'overview-topdown' : 'overview-orbit'
    }

    // ---- foco Adapta: esfera medida do contorno (sem fingir altura) --------
    const fitAdaptaFocus = (topDown = false) => {
      const adapta = data.layers.adapta_contour
      const ring = adapta.rings[0] ?? []
      if (!ring.length) {
        fitView(topDown)
        return
      }
      const box = new THREE.Box3().setFromObject(group)
      const sceneSize = box.getSize(new THREE.Vector3())
      const sceneRadius = Math.max(sceneSize.length() * 0.5, 50)

      const cPts = data.layers.contour_roof_points.points
      const contourMedian = cPts.length
        ? cPts.map((p) => p[1]).sort((a, b) => a - b)[Math.floor(cPts.length / 2)]
        : 0
      const towerBox = candidateTower ? new THREE.Box3().setFromObject(candidateTower) : null
      const center = towerBox
        ? towerBox.getCenter(new THREE.Vector3())
        : new THREE.Vector3(0, contourMedian, 0)
      const radius = Math.max(
        Math.hypot(ring[0][0], ring[0][1]),
        ...ring.slice(1).map((pt) => Math.hypot(pt[0], pt[1])),
        25,
      )
      const fov = (camera.fov * Math.PI) / 180
      const aspect = Math.max(camera.aspect, 0.01)
      const hFov = 2 * Math.atan(Math.tan(fov / 2) * aspect)
      const minFov = Math.min(fov, hFov) // o FOV mais estreito rege a distância
      const fitRadius = towerBox ? towerBox.getSize(new THREE.Vector3()).length() / 2 : radius
      const dist = (fitRadius / Math.sin(minFov / 2)) * 1.15
      if (dist > controls.maxDistance) controls.maxDistance = dist * 1.05
      camera.near = Math.max(dist / 200, 0.2)
      camera.far = Math.max(dist * 12, sceneRadius * 3)
      camera.updateProjectionMatrix()
      if (topDown) {
        camera.position.set(center.x + 0.02, center.y + dist, center.z + 0.02)
      } else {
        const dirV = new THREE.Vector3(0.62, 0.42, 0.78).normalize()
        camera.position.copy(center).add(dirV.multiplyScalar(dist))
      }
      controls.target.copy(center)
      controls.update()
      host.dataset.fitRadiusM = radius.toFixed(1)
      host.dataset.fitTarget = `0,${contourMedian.toFixed(1)},0`
      host.dataset.viewMode = topDown ? 'focus-topdown' : 'focus-orbit'
    }
    fitAdaptaFocus(false)

    // ---- API imperativa ----------------------------------------------------
    let autoRotateOn = autoRotate && !reducedMotion
    const api: SceneApi = {
      setAutoRotate: (on) => {
        autoRotateOn = on
      },
      setLayerVisible: (k, v) => {
        host.dataset[k] = String(v)
        if (k === 'terrain') terrainMesh.visible = v
        if (k === 'roof') roofCloud.visible = v
        if (k === 'buildings') bGroup.visible = v
        if (k === 'outline') {
          outline.visible = v
          marker.visible = v
          pin.visible = v
          if (candidateTower) candidateTower.visible = v
        }
      },
      setPointSize: (px) => {
        host.dataset.pointSize = String(px)
        terrainMaterial.size = px
        roofMat.size = px
        contourMat.size = px * 1.7
      },
      resetView: () => fitAdaptaFocus(false),
      setOverview: (on) => (on ? fitView(true) : fitAdaptaFocus(false)),
    }
    apiRef.current = api

    // ---- resize -------------------------------------------------------------
    const onResize = () => {
      if (!host.clientWidth || !host.clientHeight) return
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(host)

    // ---- loop ----------------------------------------------------------------
    let raf = 0
    let frame = 0
    controls.autoRotate = autoRotateOn
    controls.autoRotateSpeed = 0.6
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      controls.autoRotate = autoRotateOn
      controls.update()
      if (!reducedMotion) {
        const t = clock.getElapsedTime()
        outlineMat.opacity = 0.55 + 0.35 * Math.sin(t * 2.2)
      } else {
        outlineMat.opacity = 0.9
      }
      renderer.render(scene, camera)
      host.dataset.rendered = 'true'
      // Telemetria throttled (~5 Hz): evita construir string de dataset a cada frame.
      if (frame % 12 === 0) {
        host.dataset.camera = camera.position
          .toArray()
          .map((v) => v.toFixed(2))
          .join(',')
      }
      frame++
    }
    animate()

    // ---- cleanup ---------------------------------------------------------------
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(m)) m.forEach((x) => x.dispose())
        else m?.dispose()
      })
      markerTex.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      apiRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  useEffect(() => {
    const onReset = () => apiRef.current?.resetView()
    window.addEventListener('sp3d:reset-camera', onReset)
    return () => window.removeEventListener('sp3d:reset-camera', onReset)
  }, [])

  // ---- sincronização de props -> cena -------------------------------------
  useEffect(() => {
    for (const k of Object.keys(layers) as LayerKey[]) apiRef.current?.setLayerVisible(k, layers[k])
  }, [layers, data])

  useEffect(() => {
    apiRef.current?.setPointSize(pointSize)
  }, [pointSize, data])

  useEffect(() => {
    apiRef.current?.setOverview(overview)
  }, [overview, data])

  useEffect(() => {
    apiRef.current?.setAutoRotate(autoRotate && !reducedMotion)
  }, [autoRotate, reducedMotion, data])

  return (
    <div ref={hostRef} className="canvas-host" data-testid="scene-canvas">
      {glError && (
        <div className="sp3d-overlay">
          <div className="sp3d-errbox">
            <h2>WebGL indisponível</h2>
            <p className="sp3d-errdetail">{glError}</p>
            <p className="sp3d-errhint">
              Este explorador usa Three.js (WebGL). Abra em um navegador com WebGL habilitado
              (Chrome, Edge, Firefox ou Safari).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
