import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Board from './components/Board'
import GameControls from './components/GameControls'
import MetricsPanel from './components/MetricsPanel'
import MoveHistory from './components/MoveHistory'
import ScoreBoard from './components/ScoreBoard'
import StatusBar from './components/StatusBar'
import { BLACK, DEFAULT_AI_CONFIG, DEFAULT_MODE, WHITE } from './data/gameOptions'
import {
  getChangedCells,
  getOccupiedCells,
  playerName,
} from './utils/gameFormat'
import { getAiMove, makeMove, newGame, serviceMode } from './services/gameApi'

function App() {
  const [mode, setMode] = useState(DEFAULT_MODE)
  const [gameState, setGameState] = useState(null)
  const [aiConfig, setAiConfig] = useState(DEFAULT_AI_CONFIG)
  const [moveHistory, setMoveHistory] = useState([])
  const [metricsLog, setMetricsLog] = useState([])
  const [lastMove, setLastMove] = useState(null)
  const [changedCells, setChangedCells] = useState(new Set())
  const [autoPlay, setAutoPlay] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState('')
  const boardRef = useRef(null)

  const commitState = useCallback((nextState, move = null) => {
    setChangedCells(getChangedCells(boardRef.current, nextState.board))
    boardRef.current = nextState.board
    setGameState(nextState)
    setLastMove(move)
  }, [])

  const bootGame = useCallback(
    async (nextMode = mode) => {
      setError('')
      setIsThinking(false)
      setAutoPlay(nextMode === 'ai_vs_ai')

      try {
        const initialState = await newGame(nextMode)
        boardRef.current = initialState.board
        setGameState(initialState)
        setChangedCells(getOccupiedCells(initialState.board))
        setLastMove(null)
        setMoveHistory([])
        setMetricsLog([])
      } catch (caughtError) {
        setError(caughtError.message)
      }
    },
    [mode],
  )

  useEffect(() => {
    let isActive = true

    async function bootstrap() {
      try {
        const initialState = await newGame(DEFAULT_MODE)
        if (!isActive) return
        boardRef.current = initialState.board
        setGameState(initialState)
        setChangedCells(getOccupiedCells(initialState.board))
      } catch (caughtError) {
        if (isActive) setError(caughtError.message)
      }
    }

    bootstrap()

    return () => {
      isActive = false
    }
  }, [])

  const humanTurn = useMemo(() => {
    if (!gameState || gameState.is_terminal) return false
    if (mode === 'human_vs_human') return true
    if (mode === 'human_vs_ai') return gameState.current_player === BLACK
    return false
  }, [gameState, mode])

  const aiTurn = useMemo(() => {
    if (!gameState || gameState.is_terminal) return false
    if (mode === 'ai_vs_ai') return true
    return mode === 'human_vs_ai' && gameState.current_player === WHITE
  }, [gameState, mode])

  const statusText = useMemo(() => {
    if (!gameState) return 'Cargando'
    if (gameState.is_terminal) return `Final: ${playerName(gameState.winner)}`
    if (aiTurn) return `Turno IA: ${playerName(gameState.current_player)}`
    return `Turno humano: ${playerName(gameState.current_player)}`
  }, [aiTurn, gameState])

  const appendHistory = useCallback((entry) => {
    setMoveHistory((current) => [entry, ...current].slice(0, 48))
  }, [])

  const runAiTurn = useCallback(async () => {
    if (!gameState || !aiTurn || isThinking) return

    const player = gameState.current_player
    const config = player === BLACK ? aiConfig.black : aiConfig.white
    setError('')
    setIsThinking(true)

    try {
      const result = await getAiMove(gameState.game_id, config.algorithm, config.depth)
      commitState(result.state, result.move)

      const entry = {
        id: `${result.state.move_count}-ai-${player}-${Date.now()}`,
        kind: 'ai',
        player,
        move: result.move,
        algorithm: result.algorithm,
        depth: result.depth,
        nodes_explored: result.nodes_explored,
        time_ms: result.time_ms,
        board_eval: result.board_eval,
        depth_reached: result.depth_reached,
      }

      appendHistory(entry)
      setMetricsLog((current) => [...current, entry].slice(-32))
    } catch (caughtError) {
      setAutoPlay(false)
      setError(caughtError.message)
    } finally {
      setIsThinking(false)
    }
  }, [aiConfig, aiTurn, appendHistory, commitState, gameState, isThinking])

  useEffect(() => {
    if (!aiTurn || isThinking) return undefined
    if (mode === 'ai_vs_ai' && !autoPlay) return undefined

    const timer = window.setTimeout(runAiTurn, mode === 'ai_vs_ai' ? 520 : 620)
    return () => window.clearTimeout(timer)
  }, [aiTurn, autoPlay, isThinking, mode, runAiTurn])

  const handleCellClick = useCallback(
    async (row, col) => {
      if (!gameState || !humanTurn || isThinking) return

      const isLegal = gameState.legal_moves.some(
        ([legalRow, legalCol]) => legalRow === row && legalCol === col,
      )
      if (!isLegal) return

      const player = gameState.current_player
      setError('')

      try {
        const nextState = await makeMove(gameState.game_id, row, col)
        const move = [row, col]
        commitState(nextState, move)
        appendHistory({
          id: `${nextState.move_count}-human-${player}-${Date.now()}`,
          kind: 'human',
          player,
          move,
        })
      } catch (caughtError) {
        setError(caughtError.message)
      }
    },
    [appendHistory, commitState, gameState, humanTurn, isThinking],
  )

  const handleModeChange = useCallback(
    (nextMode) => {
      setMode(nextMode)
      bootGame(nextMode)
    },
    [bootGame],
  )

  const handleAiConfigChange = useCallback((player, patch) => {
    setAiConfig((current) => ({
      ...current,
      [player]: {
        ...current[player],
        ...patch,
      },
    }))
  }, [])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Proyecto IA 2026</p>
          <h1>Othello Arena</h1>
        </div>
        <StatusBar
          source={serviceMode}
          status={statusText}
          error={error}
          isThinking={isThinking}
          onDismissError={() => setError('')}
        />
      </header>

      <main className="game-layout">
        <div className="board-column">
          <ScoreBoard gameState={gameState} />
          {gameState ? (
            <Board
              board={gameState.board}
              legalMoves={gameState.legal_moves}
              lastMove={lastMove}
              changedCells={changedCells}
              currentPlayer={gameState.current_player}
              disabled={!humanTurn || isThinking}
              onCellClick={handleCellClick}
            />
          ) : (
            <section className="board-panel board-loading" aria-live="polite">
              Cargando partida
            </section>
          )}
        </div>

        <aside className="side-rail" aria-label="Panel de control">
          <GameControls
            mode={mode}
            aiConfig={aiConfig}
            autoPlay={autoPlay}
            canStepAi={aiTurn}
            isThinking={isThinking}
            onModeChange={handleModeChange}
            onAiConfigChange={handleAiConfigChange}
            onNewGame={() => bootGame(mode)}
            onToggleAutoPlay={() => setAutoPlay((current) => !current)}
            onStepAi={runAiTurn}
          />
          <MetricsPanel metricsLog={metricsLog} />
          <MoveHistory moves={moveHistory} />
        </aside>
      </main>
    </div>
  )
}

export default App
