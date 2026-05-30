# Integrante 3 — Frontend React + Análisis de Rendimiento

**Área:** UI/UX React + Reporte técnico  
**Fase inicial:** UI estática con datos mockeados (no depende de nadie)  
**Fase final:** Conectar API real y completar análisis  
**Archivos:** `frontend/src/` · `analysis/tournament.py` · `report/reporte.pdf`

---

## Parte 1 — Frontend React

### Fase inicial (UI estática)

Construir todos los componentes con datos mockeados. El tablero debe verse y funcionar visualmente antes de conectar la API.

#### Componentes

```
src/
├── components/
│   ├── Board.jsx           # Tablero 8×8
│   ├── Cell.jsx            # Celda individual
│   ├── Piece.jsx           # Ficha (negro/blanco) con animación de volteo
│   ├── GameControls.jsx    # Selector de modo y configuración
│   ├── MetricsPanel.jsx    # Panel de rendimiento IA
│   ├── ScoreBoard.jsx      # Marcador negro vs blanco
│   └── MoveHistory.jsx     # Historial de jugadas
└── services/
    └── gameApi.js          # Todas las llamadas a FastAPI
```

#### `Board.jsx` — Tablero

- Grid 8×8, casillas color verde oscuro/verde claro (estilo Othello clásico)
- Resaltar en color tenue los movimientos legales disponibles
- Click en celda → llamar `POST /game/move`
- Animación de volteo de fichas al aplicar movimiento (CSS flip 3D)

#### `GameControls.jsx` — Modos de juego

```
[Humano vs Humano]  [Humano vs IA]  [IA vs IA]

--- Configuración IA ---
Algoritmo: [ Alpha-Beta ▼ ]  [ MCTS ▼ ]
Profundidad: [ 4 ] [ 6 ] [ 8 ]   (solo Alpha-Beta)
```

#### `MetricsPanel.jsx` — Indicadores IA

Actualizar en tiempo real tras cada jugada IA:

```
┌─────────────────────────────┐
│  Última jugada IA           │
│  Algoritmo:  Alpha-Beta     │
│  Nodos:      14,823         │
│  Tiempo:     340 ms         │
│  Evaluación: +12.5          │
│  Profundidad: 6             │
└─────────────────────────────┘
```

---

### Fase final (Conectar API)

#### `gameApi.js`

```javascript
const BASE = 'http://localhost:8000'

export const newGame   = (mode)           => fetch(`${BASE}/game/new`,     { method:'POST', body: JSON.stringify({mode}) })
export const getState  = ()               => fetch(`${BASE}/game/state`)
export const getMove   = ()               => fetch(`${BASE}/game/moves`)
export const makeMove  = (row, col)       => fetch(`${BASE}/game/move`,     { method:'POST', body: JSON.stringify({row,col}) })
export const getAiMove = (algo, depth)    => fetch(`${BASE}/game/ai-move`,  { method:'POST', body: JSON.stringify({algorithm:algo, depth}) })
export const getMetrics= ()               => fetch(`${BASE}/game/metrics`)
```

#### Flujo de turno

```
[Turno Humano]
  Click celda → POST /game/move → actualizar estado → render

[Turno IA]
  POST /game/ai-move → mostrar spinner → recibir move+métricas
  → animar volteo → actualizar MetricsPanel → render
```

#### Modo IA vs IA

Loop automático con `setTimeout` o `useEffect`:
1. Llamar `/game/ai-move` para el jugador actual
2. Esperar respuesta + animar
3. Si no es terminal → llamar de nuevo para el otro jugador
4. Mostrar métricas de ambos agentes en tiempo real

---

## Parte 2 — Análisis de Rendimiento

Archivo: `analysis/tournament.py`

### Análisis 1 — Explosión Combinatoria

Medir nodos explorados por Minimax puro vs Alpha-Beta a distintas profundidades:

```python
depths = [2, 3, 4, 5, 6]
for d in depths:
    nodes_minimax  = run_minimax(position, d)
    nodes_alphabeta = run_alphabeta(position, d)
    b_eff_minimax   = nodes_minimax ** (1/d)
    b_eff_alphabeta = nodes_alphabeta ** (1/d)
```

**Gráfica esperada:** línea exponencial (Minimax) vs línea mucho más plana (Alpha-Beta)

### Análisis 2 — Torneo IA vs IA (20 partidas)

```
Agente A: Alpha-Beta, depth=6, heurística compuesta
Agente B: MCTS, budget=2s, C=1.41
```

```python
results = {"A_wins": 0, "B_wins": 0, "draws": 0}
for i in range(20):
    # Alternar quién juega primero (negro/blanco) cada 2 partidas
    winner = play_game(agent_a, agent_b, a_plays_black=(i%2==0))
    # registrar resultado + tiempo promedio por jugada
```

**Métricas a reportar:**

| Métrica | A (Alpha-Beta) | B (MCTS) |
|---|---|---|
| Victorias | ? | ? |
| Empates | ? | ? |
| Tiempo promedio/jugada | ? ms | ? ms |
| Violaciones del límite 2s | ? | ? |

### Gráficas para el reporte

1. **Nodos vs Profundidad** — Minimax vs Alpha-Beta (escala logarítmica)
2. **Factor de ramificación efectivo** (`b_eff`) por profundidad
3. **Resultados del torneo** — gráfica de barras: victorias/empates/derrotas
4. **Distribución de tiempos** — histograma de tiempo por jugada para cada agente

Herramienta sugerida: `matplotlib` para generar las gráficas como PNG e incrustarlas en el PDF.

---

## Parte 3 — Video de Demostración (3 minutos)

Guión sugerido:
1. **0:00–0:30** — Mostrar la UI, tablero inicial, selección de modos
2. **0:30–1:30** — Partida Humano vs IA (demostrar métricas en tiempo real)
3. **1:30–2:30** — Partida IA vs IA con ambos algoritmos, mostrar panel comparativo
4. **2:30–3:00** — Pantalla de fin de juego, marcador, resumen de métricas

---

## Checklist de entrega

- [ ] Tablero 8×8 renderizado correctamente con fichas
- [ ] Movimientos legales resaltados en cada turno
- [ ] Animación de volteo de fichas
- [ ] Modo Humano vs Humano funcional
- [ ] Modo Humano vs IA funcional (con spinner durante jugada IA)
- [ ] Modo IA vs IA funcional (loop automático)
- [ ] `MetricsPanel` mostrando nodos, tiempo y evaluación
- [ ] `tournament.py` corriendo 20 partidas y exportando resultados
- [ ] 4 gráficas generadas con matplotlib
- [ ] Reporte PDF con análisis y conclusiones
- [ ] Video de 3 minutos grabado
