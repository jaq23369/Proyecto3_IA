# Othello Arena IA

Frontend React para el proyecto de Othello/Reversi. La app inicia con mocks locales para poder demostrar el tablero, los modos de juego, el historial y las metricas IA sin depender del backend.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Backend real

Por defecto usa mocks (`VITE_USE_MOCKS=true`). Para conectar FastAPI:

```bash
VITE_USE_MOCKS=false VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

La API esperada usa rutas con `game_id`, por ejemplo `/game/{game_id}/move` y `/game/{game_id}/ai-move`.
