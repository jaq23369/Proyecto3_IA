import { History } from 'lucide-react'
import {
  moveToNotation,
  normalizeAlgorithmLabel,
  playerClass,
  playerName,
} from '../utils/gameFormat'

function MoveHistory({ moves }) {
  return (
    <section className="panel history-panel" aria-labelledby="history-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Bitacora</p>
          <h2 id="history-title">Historial</h2>
        </div>
        <History size={20} aria-hidden="true" />
      </div>

      <ol className="move-list">
        {moves.length === 0 && <li className="empty-state">Sin jugadas</li>}
        {moves.map((move) => (
          <li key={move.id} className="move-item">
            <span className={`move-disc ${playerClass(move.player)}`} aria-hidden="true" />
            <div>
              <strong>{moveToNotation(move.move)}</strong>
              <span>
                {playerName(move.player)} ·{' '}
                {move.kind === 'ai' ? normalizeAlgorithmLabel(move.algorithm) : 'Humano'}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default MoveHistory
