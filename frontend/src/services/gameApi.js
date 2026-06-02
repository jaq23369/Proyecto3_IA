import * as mockGameService from './mockGameService'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false'

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body:
      options.body && typeof options.body !== 'string'
        ? JSON.stringify(options.body)
        : options.body,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.detail ?? payload?.message ?? 'No se pudo completar la solicitud'
    throw new Error(message)
  }

  return payload
}

const realGameService = {
  newGame: (mode) =>
    request('/game/new', {
      method: 'POST',
      body: { mode },
    }),
  getState: (gameId) => request(`/game/${gameId}/state`),
  getMoves: (gameId) => request(`/game/${gameId}/moves`),
  makeMove: (gameId, row, col) =>
    request(`/game/${gameId}/move`, {
      method: 'POST',
      body: { row, col },
    }),
  getAiMove: (gameId, algorithm, depth) =>
    request(`/game/${gameId}/ai-move`, {
      method: 'POST',
      body: { algorithm, depth },
    }),
  getMetrics: (gameId) => request(`/game/${gameId}/metrics`),
}

const service = USE_MOCKS ? mockGameService : realGameService

export const serviceMode = USE_MOCKS ? 'mock' : 'api'
export const newGame = service.newGame
export const getState = service.getState
export const getMoves = service.getMoves
export const makeMove = service.makeMove
export const getAiMove = service.getAiMove
export const getMetrics = service.getMetrics
