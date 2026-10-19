import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SceneCanvas, { type LayerKey } from './Scene'
import { usePrefersReducedMotion, useSceneData, useWebglLostAlert } from './hooks'
import './explorer.css'

const LAYER_LABELS: Record<LayerKey, string> = {
  terrain: 'Terreno MDT',
  roof: 'Telhados LiDAR',
  buildings: 'Prédios cadastrais',
  outline: 'Destaque Adapta',
}

export default function ExplorerPage() {
  const { phase, retry } = useSceneData()
  const reducedMotion = usePrefersReducedMotion()
  useWebglLostAlert()

  const [pointSize, setPointSize] = useState(2.2)
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    terrain: true,
    roof: true,
    buildings: true, // apoio cadastral: somente features com base medida (sem fallback)
    outline: true,
  })
  const [overview, setOverview] = useState(false)
  // Padrão: sem rotação automática (respeita reduced-motion por padrão; controle claro na UI).
  const [autoRotate, setAutoRotate] = useState(false)
  // Painel: aberto no desktop, recolhido (drawer) por padrão no mobile.
  const [panelOpen, setPanelOpen] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? !window.matchMedia('(max-width: 768px)').matches
      : true,
  )

  const counts = useMemo(() => (phase.kind === 'ready' ? phase.data.counts : null), [phase])
  const sourceCounts = useMemo(
    () => (phase.kind === 'ready' ? phase.data.source_counts : undefined),
    [phase],
  )
  const gate = useMemo(() => (phase.kind === 'ready' ? phase.data.gate : ''), [phase])
  const epoch = useMemo(() => (phase.kind === 'ready' ? phase.data.epoch : ''), [phase])

  // Densidade da amostra derivada dos dados (stride do dataset) — nunca fixada em código.
  const densityLabel = useMemo(() => {
    if (phase.kind !== 'ready') return ''
    const stride = phase.data.sampled?.stride
    const vals = stride ? Object.values(stride) : []
    return vals.length > 0 && vals.every((v) => v <= 6) ? 'Detalhe ampliado' : 'amostra real'
  }, [phase])

  // Total dinâmico a partir dos campos de counts (mesmos campos do contrato do dataset).
  const countsTotal = useMemo(() => {
    if (!counts) return 0
    return ['terrain_cells', 'roof_points', 'contour_roof_points'].reduce(
      (acc, k) => acc + (counts[k] ?? 0),
      0,
    )
  }, [counts])

  useEffect(() => {
    if (reducedMotion) setAutoRotate(false)
  }, [reducedMotion])

  const onCanvasPointerDown = (event: React.PointerEvent) => {
    if (event.target instanceof HTMLCanvasElement) setAutoRotate(false)
  }

  const toggleLayer = (k: LayerKey) => setLayers((s) => ({ ...s, [k]: !s[k] }))

  return (
    <div className="sp3d-explorer">
      <header className="sp3d-hdr">
        <div>
          <h1>SP3D · EXPLORADOR 3D — NUVEM LiDAR 2020</h1>
          <p>
            PRECISÃO EXTERNA NÃO VALIDADA · gate NOT_VALIDATED · amostra decimada do dataset real
          </p>
        </div>
        <div className="sp3d-hdr-actions">
          <span className="sp3d-badge">ÉPOCA {epoch || '—'} · AMOSTRA</span>
          <Link className="sp3d-btn" to="/adapta">
            Chegada Adapta
          </Link>
          <Link className="sp3d-btn" to="/">
            Início
          </Link>
        </div>
      </header>

      <main className="sp3d-stage" onPointerDownCapture={onCanvasPointerDown}>
        {/* HUD mínimo: sempre visível, não esconde o aviso de precisão */}
        <div className="sp3d-hud">
          <span className="sp3d-hud-precision" title="Aviso de precisão sempre visível">
            ⚠ Precisão não validada
          </span>
          {countsTotal > 0 && (
            <span className="sp3d-hud-counts" data-testid="hud-counts">
              {countsTotal.toLocaleString('pt-BR')} pontos · amostra
            </span>
          )}
          {densityLabel && <span className="sp3d-hud-density">{densityLabel}</span>}
        </div>

        {phase.kind === 'loading' && (
          <div className="sp3d-overlay">
            <div>
              <div className="sp3d-spinner" />
              <p>Carregando cena real (amostra decimada)…</p>
            </div>
          </div>
        )}

        {phase.kind === 'error' && (
          <div className="sp3d-overlay">
            <div className="sp3d-errbox">
              <h2>Falha ao carregar a cena</h2>
              <p className="sp3d-errdetail">{phase.message}</p>
              {phase.detail && <p className="sp3d-errdetail">{phase.detail}</p>}
              <p className="sp3d-errhint">
                O arquivo <code>/scene/adapta-v1.json</code> é subamostra determinística do dataset
                SP3D gerado a partir do LiDAR 2020 real. Nenhum dado é inventado neste explorador.
              </p>
              <button className="sp3d-btn sp3d-btn-primary" onClick={retry}>
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {phase.kind === 'ready' && (
          <>
            <SceneCanvas
              data={phase.data}
              pointSize={pointSize}
              layers={layers}
              overview={overview}
              autoRotate={autoRotate}
              reducedMotion={reducedMotion}
            />

            <section
              className={`sp3d-panel ${panelOpen ? 'sp3d-panel-open' : 'sp3d-panel-closed'}`}
            >
              <button
                type="button"
                className="sp3d-panel-toggle"
                onClick={() => setPanelOpen((v) => !v)}
                aria-expanded={panelOpen}
                aria-controls="sp3d-panel-body"
                data-testid="panel-toggle"
              >
                <span className="sp3d-panel-toggle-label">
                  {panelOpen ? 'Fechar painel' : 'Controles e detalhes'}
                </span>
                <span className="sp3d-panel-chevron" aria-hidden="true">
                  {panelOpen ? '▾' : '▴'}
                </span>
              </button>

              <div
                id="sp3d-panel-body"
                className="sp3d-panel-body"
                aria-hidden={!panelOpen}
                inert={!panelOpen}
              >
                <div className="sp3d-btnrow">
                  {(Object.keys(LAYER_LABELS) as LayerKey[]).map((k) => (
                    <button
                      key={k}
                      className={`sp3d-btn ${layers[k] ? 'sp3d-btn-active' : ''}`}
                      onClick={() => toggleLayer(k)}
                      aria-pressed={layers[k]}
                    >
                      {LAYER_LABELS[k]}
                    </button>
                  ))}
                  <button
                    className={`sp3d-btn ${overview ? 'sp3d-btn-active' : ''}`}
                    onClick={() => setOverview((v) => !v)}
                    aria-pressed={overview}
                  >
                    Vista geral
                  </button>
                  <button
                    className="sp3d-btn"
                    onClick={() => setAutoRotate((value) => !value)}
                    disabled={reducedMotion}
                  >
                    {autoRotate ? 'Pausar movimento' : 'Retomar movimento'}
                  </button>
                  <button
                    className="sp3d-btn"
                    onClick={() => {
                      setOverview(false)
                      apiReset()
                    }}
                  >
                    Foco Adapta (reset)
                  </button>
                </div>

                <div className="sp3d-slider">
                  <label htmlFor="sp3d-psize">Tamanho do ponto</label>
                  <input
                    id="sp3d-psize"
                    type="range"
                    min={0.4}
                    max={6}
                    step={0.1}
                    value={pointSize}
                    onChange={(e) => setPointSize(Number(e.target.value))}
                  />
                  <span className="sp3d-val">{pointSize.toFixed(1)}px</span>
                </div>

                <ul className="sp3d-legend">
                  <li>
                    <span className="sp3d-dot sp3d-dot-roof" /> Telhados LiDAR class6 (cor = altura)
                  </li>
                  <li>
                    <span className="sp3d-dot" style={{ background: '#fbbf24' }} /> Contorno
                    candidato NORTE (Adapta)
                  </li>
                  <li>
                    <span className="sp3d-dot" style={{ background: '#3f4a5a' }} /> Prédios
                    cadastrais (extrusão edificacao_v3, somente com base medida; camada opcional)
                  </li>
                  <li>
                    <span
                      className="sp3d-dot"
                      style={{ background: 'linear-gradient(90deg,#14532d,#65a30d,#fde047)' }}
                    />{' '}
                    Terreno MDT em pontos medidos (sem interpolação; cor = altura)
                  </li>
                </ul>

                {counts && (
                  <p className="sp3d-counts">
                    Amostra disponível: {counts.terrain_cells.toLocaleString('pt-BR')} células de
                    terreno · {counts.roof_points.toLocaleString('pt-BR')} pontos de telhado ·{' '}
                    {phase.data.layers.buildings.features.filter((f) => f.base_z_m != null).length}{' '}
                    prédios com base medida ({counts.buildings.toLocaleString('pt-BR')} disponíveis)
                    · contorno {counts.contour_roof_points.toLocaleString('pt-BR')} pts · gate:{' '}
                    {gate}
                    {densityLabel && (
                      <>
                        {' '}
                        · <strong>{densityLabel}</strong>
                      </>
                    )}
                  </p>
                )}

                {sourceCounts && (
                  <p className="sp3d-prov">
                    Dataset completo: {sourceCounts.total_points.toLocaleString('pt-BR')} pontos (
                    {sourceCounts.terrain_cells.toLocaleString('pt-BR')} células ·{' '}
                    {sourceCounts.roof_points.toLocaleString('pt-BR')} telhado ·{' '}
                    {sourceCounts.contour_roof_points.toLocaleString('pt-BR')} contorno ·{' '}
                    {sourceCounts.buildings} prédios) — exibição decimada por stride, nada
                    inventado.
                  </p>
                )}

                <details className="sp3d-limits">
                  <summary>Limitações declaradas (do dataset)</summary>
                  <ul>
                    {(phase.data.limits ?? []).map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                  <p className="sp3d-prov">
                    Fonte:{' '}
                    {phase.data.provenance?.lidar?.map((l) => `${l.tile}/${l.kind}`).join(', ')} ·{' '}
                    {phase.data.crs} · época {phase.data.epoch}
                    {phase.data.sampled ? ` · amostra ${phase.data.sampled.method}` : ''}
                  </p>
                </details>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function apiReset() {
  window.dispatchEvent(new CustomEvent('sp3d:reset-camera'))
}
