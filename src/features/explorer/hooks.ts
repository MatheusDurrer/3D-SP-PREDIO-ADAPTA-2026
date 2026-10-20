import { useCallback, useEffect, useRef, useState } from 'react'
import type { SceneData } from './types'
import { loadNeighborReference } from './neighbor'
import { readDense } from './density'
import { decodeGroundMesh, EXPECTED_GROUND_SHA256, GROUND_MESH_URL, sha256Hex } from './ground'

type Phase =
  | { kind: 'loading' }
  | { kind: 'ready'; data: SceneData }
  | { kind: 'error'; message: string; detail?: string }

const FETCH_TIMEOUT_MS = 15000

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}

function validate(d: unknown): string | null {
  if (!isRecord(d)) return 'JSON raiz não é um objeto'
  if (typeof d.schema !== 'string' || !d.schema.startsWith('sp3d_scene_adapta/'))
    return 'schema inesperado (esperado sp3d_scene_adapta/1)'
  if (!isRecord(d.layers)) return 'camada layers ausente'
  const L = d.layers as Record<string, unknown>
  for (const k of ['terrain', 'roof_points', 'contour_roof_points', 'buildings', 'adapta_contour'])
    if (!isRecord(L[k])) return `camada ${k} ausente`
  if (!Array.isArray((L.terrain as Record<string, unknown>).points)) return 'terrain.points ausente'
  if (!Array.isArray((L.roof_points as Record<string, unknown>).points))
    return 'roof_points.points ausente'
  if (!Array.isArray((L.contour_roof_points as Record<string, unknown>).points))
    return 'contour_roof_points ausente'
  if (!Array.isArray((L.buildings as Record<string, unknown>).features))
    return 'buildings.features ausente'
  for (const key of ['terrain', 'roof_points', 'contour_roof_points']) {
    const points = (L[key] as Record<string, unknown>).points as unknown[]
    if (
      !points.length ||
      !points.every(
        (p) =>
          Array.isArray(p) &&
          p.length === 3 &&
          p.every((v) => typeof v === 'number' && Number.isFinite(v)),
      )
    ) {
      return `pontos inválidos na camada ${key}`
    }
  }

  return null
}

export function useSceneData(): {
  phase: Phase
  retry: () => void
  ground: boolean
} {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const [ground, setGround] = useState(false)

  const retry = useCallback(() => setAttempt((a) => a + 1), [])

  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    setPhase({ kind: 'loading' })
    setGround(false)

    fetch('/scene/adapta-v1.json', { cache: 'no-store', signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<unknown>
      })
      .then(async (raw) => {
        if (!alive) return
        const err = validate(raw)
        if (err) throw new Error(`scene data inválido: ${err}`)
        const data = raw as SceneData
        const towerCtrl = new AbortController()
        const towerTimer = setTimeout(() => towerCtrl.abort(), 5000)
        try {
          const towerResponse = await fetch('/scene/tower-candidate-v1.json', {
            cache: 'no-store',
            signal: towerCtrl.signal,
          })
          if (!towerResponse.ok) throw new Error(`HTTP ${towerResponse.status}`)
          const candidate = await towerResponse.json()
          if (
            candidate.schema !== 'sp3d_tower_candidate/1' ||
            candidate.source_glb_sha256 !==
              'b3568fe45eb3ff87ab5fc05b08b2d4183ba33cd58989f8a616638e2d33a78dba' ||
            !Array.isArray(candidate.profiles) ||
            candidate.profiles.length !== 3
          )
            throw new Error('Modelo candidato inválido')
          data.towerCandidate = candidate
          data.limits = [
            ...data.limits,
            'TORRE SÓLIDA CANDIDATA: corpo extrudado do contorno de telhado; volumes médio/podium inferidos de LiDAR. Juntas procedurais; fachada, curvatura e recuos não aprovados. Solo texturizado ainda não integrado.',
          ]
        } catch {
          data.limits = [
            ...data.limits,
            'Modelo sólido candidato indisponível; exibindo apenas dados técnicos.',
          ]
        } finally {
          clearTimeout(towerTimer)
        }
        const neighborCtrl = new AbortController()
        const abortNeighbor = () => neighborCtrl.abort()
        ctrl.signal.addEventListener('abort', abortNeighbor, { once: true })
        const neighborTimer = setTimeout(abortNeighbor, 3500)
        try {
          data.neighborReference = await loadNeighborReference(neighborCtrl.signal)
          data.neighborNote = 'SSE: LiDAR 2020, prisma aproximado de telhado; nao validado 2025'
          data.limits = [
            ...data.limits,
            'VIZINHO SSE: altura e contorno de telhado derivados do LiDAR 2020; paredes verticais inferidas. Sem nome comercial, fachada, recuos ou heliponto modelados. Sete faixas iguais do prototipo descartadas por nao serem estratos medidos.',
          ]
        } catch (error) {
          data.neighborNote = `Referencia SSE indisponivel: ${error instanceof Error ? error.message : String(error)}`
          data.limits = [...data.limits, data.neighborNote]
        } finally {
          clearTimeout(neighborTimer)
          ctrl.signal.removeEventListener('abort', abortNeighbor)
        }
        if (!alive) return
        // ---- malha do solo (opcional, timeout 5s, fallback honesto p/ pontos) --
        const groundCtrl = new AbortController()
        const groundTimer = setTimeout(() => groundCtrl.abort(), 5000)
        try {
          const gResp = await fetch(GROUND_MESH_URL, {
            cache: 'no-store',
            signal: groundCtrl.signal,
          })
          if (!gResp.ok) throw new Error(`HTTP ${gResp.status}`)
          const gBuf = await gResp.arrayBuffer()
          const gSha = await sha256Hex(gBuf)
          if (gSha !== EXPECTED_GROUND_SHA256)
            throw new Error(`SHA-256 divergente (${gSha.slice(0, 12)}…)`)
          const mesh = decodeGroundMesh(new Uint8Array(gBuf))
          if (!alive) return
          data.ground = mesh
          data.groundFaces = mesh.nF
          data.groundMode = 'mesh'
          setGround(true)
          data.groundNote = 'Solo MDT 2020 · malha medida sem textura (ortofoto pendente)'
          data.limits = [
            ...data.limits,
            `SOLO COMO MALHA MEDIDA: ${mesh.nV.toLocaleString('pt-BR')} vértices e ${mesh.nF.toLocaleString('pt-BR')} faces decodificados de ground-mesh-v1.bin (SHA-256 verificado); conectividade reconstruída por componentes 4-conectadas, 1:1 com o GLB validado (faceMiss 0). Sem textura: ortofoto 2020 ainda não integrada.`,
          ]
        } catch (gErr) {
          if (!alive) return
          const gMsg = gErr instanceof Error ? gErr.message : String(gErr)
          data.groundMode = 'points'
          data.groundNote = `Solo MDT · pontos medidos (malha indisponível: ${gMsg})`
        } finally {
          clearTimeout(groundTimer)
        }
        if (!alive) return
        const detailCtrl = new AbortController()
        const abortDetail = () => detailCtrl.abort()
        ctrl.signal.addEventListener('abort', abortDetail, { once: true })
        const detailTimer = setTimeout(abortDetail, 7000)
        try {
          const response = await fetch('/scene/adapta-dense-v2.bin', {
            cache: 'no-store',
            signal: detailCtrl.signal,
          })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const points = await readDense(await response.arrayBuffer())
          if (!alive) return
          data.layers.terrain.points = points[0]
          data.layers.roof_points.points = points[1]
          data.layers.contour_roof_points.points = points[2]
          data.counts = {
            ...data.counts,
            terrain_cells: points[0].length,
            roof_points: points[1].length,
            contour_roof_points: points[2].length,
          }
          if (data.sampled) {
            data.sampled.stride = { terrain: 6, roof_points: 6, contour_roof_points: 1 }
            data.sampled.method =
              'Detalhe ampliado: subamostra exata por stride 6/6/1; codec sem perda em centímetros; nenhuma interpolação'
            data.sampled.effective_grid_m = {}
          }
          data.limits = [
            ...data.limits,
            'DETALHE AMPLIADO: 7.508 posições originais verificadas por SHA-256; decimação por stride não define uma grade regular. Terreno é exibido como pontos medidos, sem interpolação.',
          ]
        } catch (error) {
          if (!alive) return
          const reason = error instanceof Error ? error.message : String(error)
          data.limits = [
            ...data.limits,
            `Detalhe ampliado indisponível (${reason}). Exibindo amostra leve original de 1.681 posições; nenhuma posição foi inventada.`,
          ]
          if (data.sampled)
            data.sampled.method =
              'Modo leve: detalhe ampliado indisponível; subamostra original de 1.681 posições'
        } finally {
          clearTimeout(detailTimer)
          ctrl.signal.removeEventListener('abort', abortDetail)
        }
        if (alive) setPhase({ kind: 'ready', data })
      })
      .catch((e: unknown) => {
        if (!alive) return
        const msg = e instanceof Error ? e.message : String(e)
        const detail =
          msg === 'The user aborted a request.' ? `timeout ${FETCH_TIMEOUT_MS}ms` : undefined
        setPhase({ kind: 'error', message: 'Falha ao carregar cena', detail: detail ?? msg })
      })
      .finally(() => clearTimeout(timer))

    return () => {
      alive = false
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [attempt])

  return { phase, retry, ground }
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const fn = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])
  return reduced
}

/** Non-blocking recovery status, scoped to the explorer canvas. */
export function useWebglLostAlert(): 'ready' | 'lost' | 'restored' {
  const fired = useRef(false)
  const [status, setStatus] = useState<'ready' | 'lost' | 'restored'>('ready')
  useEffect(() => {
    const isExplorer = (event: Event) =>
      event.target instanceof HTMLCanvasElement &&
      !!event.target.closest('[data-testid="scene-canvas"]')
    const onLost = (event: Event) => {
      if (!isExplorer(event)) return
      event.preventDefault()
      if (fired.current) return
      fired.current = true
      setStatus('lost')
    }
    const onRestored = (event: Event) => {
      if (!isExplorer(event)) return
      fired.current = false
      setStatus('restored')
    }
    window.addEventListener('webglcontextlost', onLost, true)
    window.addEventListener('webglcontextrestored', onRestored, true)
    return () => {
      window.removeEventListener('webglcontextlost', onLost, true)
      window.removeEventListener('webglcontextrestored', onRestored, true)
    }
  }, [])
  return status
}
