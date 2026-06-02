import { BLACK, WHITE } from '../data/gameOptions'

const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

export function playerName(player) {
  if (player === BLACK) return 'Negras'
  if (player === WHITE) return 'Blancas'
  return 'Empate'
}

export function playerClass(player) {
  if (player === BLACK) return 'black'
  if (player === WHITE) return 'white'
  return 'draw'
}

export function moveToNotation(move) {
  if (!Array.isArray(move) || move.length < 2) return '--'
  const [row, col] = move
  return `${COLUMNS[col] ?? '?'}${row + 1}`
}

export function formatNumber(value) {
  if (value === null || value === undefined) return '--'
  return new Intl.NumberFormat('es-GT').format(Math.round(Number(value)))
}

export function formatMs(value) {
  if (value === null || value === undefined) return '--'
  const number = Number(value)
  if (number >= 1000) return `${(number / 1000).toFixed(2)} s`
  return `${Math.round(number)} ms`
}

export function formatEval(value) {
  if (value === null || value === undefined) return '--'
  const number = Number(value)
  const sign = number > 0 ? '+' : ''
  return `${sign}${number.toFixed(1)}`
}

export function normalizeAlgorithmLabel(algorithm) {
  const key = String(algorithm ?? '').toLowerCase()
  if (key.includes('alpha')) return 'Alpha-Beta'
  if (key.includes('mcts')) return 'MCTS'
  if (key.includes('expect')) return 'Expectimax'
  return algorithm || 'IA'
}

export function getChangedCells(previousBoard, nextBoard) {
  const changed = new Set()
  if (!previousBoard || !nextBoard) return changed

  for (let row = 0; row < nextBoard.length; row += 1) {
    for (let col = 0; col < nextBoard[row].length; col += 1) {
      if (previousBoard[row]?.[col] !== nextBoard[row][col]) {
        changed.add(`${row}-${col}`)
      }
    }
  }

  return changed
}

export function getOccupiedCells(board) {
  const occupied = new Set()
  if (!board) return occupied

  for (let row = 0; row < board.length; row += 1) {
    for (let col = 0; col < board[row].length; col += 1) {
      if (board[row][col] !== 0) occupied.add(`${row}-${col}`)
    }
  }

  return occupied
}
