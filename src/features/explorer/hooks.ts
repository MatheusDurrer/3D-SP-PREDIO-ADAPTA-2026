import { useCallback, useEffect, useRef, useState } from 'react'
import type { SceneData } from './types'

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
} {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => setAttempt((a) => a + 1), [])

  useEffect(() => {
    let alive = true
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    setPhase({ kind: 'loading' })

    fetch('/scene/adapta-v1.json', { cache: 'no-store', signal: ctrl.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<unknown>
      })
      .then((raw) => {
        if (!alive) return
        const err = validate(raw)
        if (err) throw new Error(`scene data inválido: ${err}`)
        setPhase({ kind: 'ready', data: raw as SceneData })
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

  return { phase, retry }
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

/** Detecta perda do contexto WebGL e dispara alerta nativo uma única vez. */
export function useWebglLostAlert(): void {
  const fired = useRef(false)
  useEffect(() => {
    const onLost = () => {
      if (fired.current) return
      fired.current = true
      window.alert(
        'Contexto WebGL perdido. A cena foi interrompida — recarregue a página para restaurar o preview.',
      )
    }
    window.addEventListener('webglcontextlost', onLost, true)
    return () => window.removeEventListener('webglcontextlost', onLost, true)
  }, [])
}
