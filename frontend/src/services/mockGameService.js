import { BLACK, EMPTY, WHITE } from '../data/gameOptions'

const BOARD_SIZE = 8
const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

const games = new Map()
const lastMetrics = new Map()

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function createBoard() {
  const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY))
  board[3][3] = WHITE
  board[3][4] = BLACK
  board[4][3] = BLACK
  board[4][4] = WHITE
  return board
}

function cloneBoard(board) {
  return board.map((row) => [...row])
}

function createGame() {
  return {
    game_id: crypto.randomUUID(),
    board: createBoard(),
    current_player: BLACK,
    move_count: 0,
    last_move: null,
    passed_last: false,
  }
}

function score(board) {
  let black = 0
  let white = 0

  for (const row of board) {
    for (const cell of row) {
      if (cell === BLACK) black += 1
      if (cell === WHITE) white += 1
    }
  }

  return { black, white }
}

function isInside(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

function flipsInDirection(board, row, col, player, rowDelta, colDelta) {
  const enemy = -player
  const candidates = []
  let nextRow = row + rowDelta
  let nextCol = col + colDelta

  while (isInside(nextRow, nextCol) && board[nextRow][nextCol] === enemy) {
    candidates.push([nextRow, nextCol])
    nextRow += rowDelta
    nextCol += colDelta
  }

  if (
    candidates.length > 0 &&
    isInside(nextRow, nextCol) &&
    board[nextRow][nextCol] === player
  ) {
    return candidates
  }

  return []
}

function getFlips(board, row, col, player) {
  if (board[row][col] !== EMPTY) return []

  return DIRECTIONS.flatMap(([rowDelta, colDelta]) =>
    flipsInDirection(board, row, col, player, rowDelta, colDelta),
  )
}

function legalMovesFor(board, player) {
  const moves = []

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (getFlips(board, row, col, player).length > 0) moves.push([row, col])
    }
  }

  return moves
}

function hasAnyMove(board, player) {
  return legalMovesFor(board, player).length > 0
}

function isTerminal(game) {
  const hasEmpty = game.board.some((row) => row.some((cell) => cell === EMPTY))
  if (!hasEmpty) return true
  return !hasAnyMove(game.board, BLACK) && !hasAnyMove(game.board, WHITE)
}

function getWinner(game) {
  if (!isTerminal(game)) return null
  const currentScore = score(game.board)
  if (currentScore.black > currentScore.white) return BLACK
  if (currentScore.white > currentScore.black) return WHITE
  return 0
}

function getPhase(game) {
  const { black, white } = score(game.board)
  const total = black + white
  if (total <= 14) return 'opening'
  if (total <= 44) return 'midgame'
  return 'endgame'
}

function serialize(game) {
  const currentScore = score(game.board)

  return {
    game_id: game.game_id,
    board: cloneBoard(game.board),
    current_player: game.current_player,
    legal_moves: legalMovesFor(game.board, game.current_player),
    score: currentScore,
    phase: getPhase(game),
    is_terminal: isTerminal(game),
    winner: getWinner(game),
    move_count: game.move_count,
  }
}

function getGame(gameId) {
  const game = games.get(gameId)
  if (!game) throw new Error(`Partida '${gameId}' no encontrada`)
  return game
}

function applyMove(game, row, col) {
  const flips = getFlips(game.board, row, col, game.current_player)
  if (flips.length === 0) {
    throw new Error(`Movimiento ${row},${col} no es legal`)
  }

  game.board[row][col] = game.current_player
  for (const [flipRow, flipCol] of flips) {
    game.board[flipRow][flipCol] = game.current_player
  }

  game.last_move = [row, col]
  game.move_count += 1

  const opponent = -game.current_player
  if (hasAnyMove(game.board, opponent)) {
    game.current_player = opponent
    game.passed_last = false
  } else if (hasAnyMove(game.board, game.current_player)) {
    game.passed_last = true
  } else {
    game.passed_last = true
  }
}

function evaluateBoard(board, player) {
  const { black, white } = score(board)
  const discDiff = player === BLACK ? black - white : white - black
  const mobilityDiff =
    legalMovesFor(board, player).length - legalMovesFor(board, -player).length
  const corners = [
    board[0][0],
    board[0][7],
    board[7][0],
    board[7][7],
  ].reduce((total, cell) => {
    if (cell === player) return total + 1
    if (cell === -player) return total - 1
    return total
  }, 0)

  return discDiff * 2 + mobilityDiff * 6 + corners * 24
}

function scoreMove(game, move, player) {
  const simulated = {
    ...game,
    board: cloneBoard(game.board),
    current_player: player,
  }
  applyMove(simulated, move[0], move[1])
  const [row, col] = move
  const cornerBonus = (row === 0 || row === 7) && (col === 0 || col === 7) ? 40 : 0
  const edgeBonus = row === 0 || row === 7 || col === 0 || col === 7 ? 8 : 0
  return evaluateBoard(simulated.board, player) + cornerBonus + edgeBonus
}

function chooseMove(game, algorithm) {
  const player = game.current_player
  const moves = legalMovesFor(game.board, player)
  if (moves.length === 0) throw new Error('No hay movimientos disponibles para la IA')

  const ranked = moves
    .map((move) => ({ move, score: scoreMove(game, move, player) }))
    .sort((left, right) => right.score - left.score)

  if (algorithm === 'mcts') {
    const candidates = ranked.slice(0, Math.min(3, ranked.length))
    return candidates[Math.floor(Math.random() * candidates.length)].move
  }

  if (algorithm === 'expectimax' && ranked.length > 1 && Math.random() > 0.7) {
    return ranked[1].move
  }

  return ranked[0].move
}

function normalizeAlgorithm(algorithm) {
  return String(algorithm ?? 'alpha_beta').toLowerCase().replace('-', '_')
}

function nodesForAlgorithm(algorithm, depth, moveCount) {
  if (algorithm === 'mcts') return 1200 + Math.round(Math.random() * 900)
  if (algorithm === 'expectimax') return Math.round(Math.pow(4.2, Math.min(depth, 5)) + moveCount * 11)
  return Math.round(Math.pow(5.4, Math.min(depth, 7)) + moveCount * 17)
}

export async function newGame() {
  await sleep(120)
  const game = createGame()
  games.set(game.game_id, game)
  lastMetrics.delete(game.game_id)
  return serialize(game)
}

export async function getState(gameId) {
  await sleep(80)
  return serialize(getGame(gameId))
}

export async function getMoves(gameId) {
  await sleep(60)
  const game = getGame(gameId)
  return { legal_moves: legalMovesFor(game.board, game.current_player) }
}

export async function makeMove(gameId, row, col) {
  await sleep(180)
  const game = getGame(gameId)
  applyMove(game, row, col)
  return serialize(game)
}

export async function getAiMove(gameId, algorithm = 'alpha_beta', depth = 6) {
  const game = getGame(gameId)
  const normalizedAlgorithm = normalizeAlgorithm(algorithm)
  const startedAt = performance.now()
  await sleep(normalizedAlgorithm === 'mcts' ? 720 : 420)

  const move = chooseMove(game, normalizedAlgorithm)
  applyMove(game, move[0], move[1])

  const metrics = {
    move,
    algorithm: normalizedAlgorithm,
    depth,
    nodes_explored: nodesForAlgorithm(normalizedAlgorithm, depth, game.move_count),
    time_ms: Number((performance.now() - startedAt).toFixed(2)),
    board_eval: Number(evaluateBoard(game.board, -game.current_player).toFixed(2)),
    depth_reached: normalizedAlgorithm === 'mcts' ? 0 : Math.min(depth, 8),
    state: serialize(game),
  }

  lastMetrics.set(gameId, metrics)
  return metrics
}

export async function getMetrics(gameId) {
  await sleep(60)
  const metrics = lastMetrics.get(gameId)
  if (!metrics) throw new Error('Aun no se ha realizado ningun movimiento de IA')
  return metrics
}
