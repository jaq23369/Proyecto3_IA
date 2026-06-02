import { EMPTY } from '../data/gameOptions'
import { moveToNotation, playerName } from '../utils/gameFormat'
import Piece from './Piece'

function Cell({
  row,
  col,
  value,
  isLegal,
  isLastMove,
  isChanged,
  currentPlayer,
  disabled,
  onClick,
}) {
  const label = value === EMPTY ? 'Casilla vacia' : `Ficha de ${playerName(value).toLowerCase()}`
  const actionLabel = isLegal ? ', movimiento legal' : ''

  return (
    <button
      type="button"
      className={`board-cell ${isLegal ? 'is-legal' : ''} ${isLastMove ? 'is-last' : ''}`}
      aria-label={`${moveToNotation([row, col])}: ${label}${actionLabel}`}
      aria-pressed={isLastMove}
      disabled={disabled || !isLegal}
      onClick={() => onClick(row, col)}
    >
      {value !== EMPTY && <Piece value={value} isChanged={isChanged} />}
      {isLegal && value === EMPTY && (
        <span className="legal-marker" aria-hidden="true">
          <span className="legal-dot" />
          <span className="legal-ring" />
        </span>
      )}
      {isLegal && value === EMPTY && (
        <span className="sr-only">Juega {playerName(currentPlayer)} aqui</span>
      )}
    </button>
  )
}

export default Cell
