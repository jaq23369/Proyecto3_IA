export const BLACK = 1
export const WHITE = -1
export const EMPTY = 0

export const DEFAULT_MODE = 'human_vs_ai'

export const MODE_OPTIONS = [
  { value: 'human_vs_human', label: 'Humano vs Humano' },
  { value: 'human_vs_ai', label: 'Humano vs IA' },
  { value: 'ai_vs_ai', label: 'IA vs IA' },
]

export const ALGORITHM_OPTIONS = [
  { value: 'alpha_beta', label: 'Alpha-Beta' },
  { value: 'mcts', label: 'MCTS' },
  { value: 'expectimax', label: 'Expectimax' },
]

export const DEPTH_OPTIONS = [4, 6, 8]

export const DEFAULT_AI_CONFIG = {
  black: { algorithm: 'alpha_beta', depth: 6 },
  white: { algorithm: 'mcts', depth: 6 },
}

export const PHASE_LABELS = {
  opening: 'Apertura',
  midgame: 'Juego medio',
  endgame: 'Final',
}
