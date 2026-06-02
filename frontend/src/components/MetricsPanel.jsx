import { Activity, Gauge, Target, Timer } from 'lucide-react'
import {
  formatEval,
  formatMs,
  formatNumber,
  moveToNotation,
  normalizeAlgorithmLabel,
  playerClass,
  playerName,
} from '../utils/gameFormat'

function average(items, key) {
  if (items.length === 0) return null
  return items.reduce((total, item) => total + Number(item[key] ?? 0), 0) / items.length
}

function MetricsPanel({ metricsLog }) {
  const latest = metricsLog.at(-1)
  const blackMetrics = metricsLog.filter((metric) => metric.player === 1)
  const whiteMetrics = metricsLog.filter((metric) => metric.player === -1)

  const summary = [
    { player: 1, items: blackMetrics },
    { player: -1, items: whiteMetrics },
  ]

  return (
    <section className="panel metrics-panel" aria-labelledby="metrics-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Telemetria IA</p>
          <h2 id="metrics-title">Rendimiento</h2>
        </div>
        <Gauge size={20} aria-hidden="true" />
      </div>

      <div className="latest-metrics" aria-live="polite">
        <div className="latest-move">
          <span>Ultima jugada IA</span>
          <strong>{moveToNotation(latest?.move)}</strong>
        </div>
        <div className="metric-grid">
          <div>
            <Activity size={16} aria-hidden="true" />
            <span>Algoritmo</span>
            <strong>{normalizeAlgorithmLabel(latest?.algorithm)}</strong>
          </div>
          <div>
            <Target size={16} aria-hidden="true" />
            <span>Nodos</span>
            <strong>{formatNumber(latest?.nodes_explored)}</strong>
          </div>
          <div>
            <Timer size={16} aria-hidden="true" />
            <span>Tiempo</span>
            <strong>{formatMs(latest?.time_ms)}</strong>
          </div>
          <div>
            <Gauge size={16} aria-hidden="true" />
            <span>Evaluacion</span>
            <strong>{formatEval(latest?.board_eval)}</strong>
          </div>
        </div>
      </div>

      <div className="agent-summary">
        {summary.map(({ player, items }) => (
          <div key={player} className={`summary-card ${playerClass(player)}`}>
            <span>{playerName(player)}</span>
            <strong>{items.length}</strong>
            <small>{formatMs(average(items, 'time_ms'))} prom.</small>
          </div>
        ))}
      </div>
    </section>
  )
}

export default MetricsPanel
