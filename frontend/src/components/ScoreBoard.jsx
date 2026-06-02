import { CircleDot, Trophy } from 'lucide-react'
import { PHASE_LABELS } from '../data/gameOptions'
import { playerClass, playerName } from '../utils/gameFormat'

function ScoreBoard({ gameState }) {
  const score = gameState?.score ?? { black: 2, white: 2 }
  const total = Math.max(1, score.black + score.white)
  const blackPercent = (score.black / total) * 100
  const winner = gameState?.winner
  const isTerminal = gameState?.is_terminal

  return (
    <section className="score-panel" aria-labelledby="score-title">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Marcador</p>
          <h2 id="score-title">Control de partida</h2>
        </div>
        <span className={`turn-chip ${playerClass(gameState?.current_player)}`}>
          <CircleDot size={16} aria-hidden="true" />
          {isTerminal ? 'Finalizada' : playerName(gameState?.current_player)}
        </span>
      </div>

      <div className="score-row">
        <div className="score-side">
          <span className="disc-swatch black" aria-hidden="true" />
          <span>Negras</span>
          <strong>{score.black}</strong>
        </div>
        <div className="score-side align-right">
          <span className="disc-swatch white" aria-hidden="true" />
          <span>Blancas</span>
          <strong>{score.white}</strong>
        </div>
      </div>

      <div className="score-track" aria-hidden="true">
        <span className="score-fill black" style={{ width: `${blackPercent}%` }} />
        <span className="score-fill white" />
      </div>

      <div className="match-facts">
        <span>{PHASE_LABELS[gameState?.phase] ?? 'Apertura'}</span>
        <span>{gameState?.move_count ?? 0} jugadas</span>
        <span className="winner-chip">
          <Trophy size={15} aria-hidden="true" />
          {isTerminal ? `Gana ${playerName(winner)}` : 'En curso'}
        </span>
      </div>
    </section>
  )
}

export default ScoreBoard
