import { moveToNotation } from '../utils/gameFormat'
import Cell from './Cell'

const FILES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function Board({
  board,
  legalMoves,
  lastMove,
  changedCells,
  currentPlayer,
  disabled,
  onCellClick,
}) {
  const legalSet = new Set(legalMoves.map(([row, col]) => `${row}-${col}`))
  const lastKey = Array.isArray(lastMove) ? `${lastMove[0]}-${lastMove[1]}` : ''

  return (
    <section className="board-panel" aria-labelledby="board-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Tablero 8x8</p>
          <h2 id="board-title">Arena Othello</h2>
        </div>
        <span className="last-move-pill">Ultima: {moveToNotation(lastMove)}</span>
      </div>

      <div className="board-shell">
        <div className="board-files" aria-hidden="true">
          {FILES.map((file) => (
            <span key={file}>{file}</span>
          ))}
        </div>
        <div className="board-with-ranks">
          <div className="board-ranks" aria-hidden="true">
            {FILES.map((_, index) => (
              <span key={index}>{index + 1}</span>
            ))}
          </div>
          <div className="board-grid" role="grid" aria-label="Tablero de Othello">
            {board.map((cells, row) =>
              cells.map((value, col) => {
                const key = `${row}-${col}`
                return (
                  <Cell
                    key={key}
                    row={row}
                    col={col}
                    value={value}
                    isLegal={legalSet.has(key)}
                    isLastMove={lastKey === key}
                    isChanged={changedCells.has(key)}
                    currentPlayer={currentPlayer}
                    disabled={disabled}
                    onClick={onCellClick}
                  />
                )
              }),
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Board
