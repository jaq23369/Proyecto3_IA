import { BLACK } from '../data/gameOptions'

function Piece({ value, isChanged }) {
  const color = value === BLACK ? 'black' : 'white'

  return (
    <span className={`piece piece-${color} ${isChanged ? 'piece-changed' : ''}`} aria-hidden="true">
      <span className="piece-surface piece-front" />
      <span className="piece-surface piece-back" />
    </span>
  )
}

export default Piece
