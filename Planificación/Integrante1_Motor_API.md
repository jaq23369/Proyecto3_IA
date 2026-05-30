# Integrante 1 — Motor de Juego (GameEngine) + API

**Área:** Backend — lógica del juego Othello y servidor API  
**Prioridad máxima:** definir contratos JSON cuanto antes para no bloquear a los demás

---

## Parte 1 — Clase `GameEngine` (Python puro)

Archivo: `backend/game_engine.py`

### Estado del tablero

```python
# Representación sugerida
board: list[list[int]]  # 0=vacío, 1=negro, -1=blanco
current_player: int     # 1 o -1
move_count: int         # número de jugada (para detectar fase)
```

### Posición inicial

```
. . . . . . . .
. . . . . . . .
. . . . . . . .
. . . W B . . .
. . . B W . . .
. . . . . . . .
. . . . . . . .
. . . . . . . .
```
Negro (B) en d5/e4 · Blanco (W) en d4/e5 · Negro mueve primero.

### Métodos obligatorios

| Método | Descripción |
|---|---|
| `get_legal_moves()` | Lista de `(row, col)` válidos para `current_player`. Un movimiento es válido si voltea al menos una ficha enemiga en cualquier dirección (8 direcciones). |
| `apply_move(row, col)` | Coloca ficha, voltea todas las fichas enemigas encerradas, cambia turno. Si el siguiente jugador no tiene movimientos, vuelve a pasar el turno. |
| `is_terminal()` | `True` si ningún jugador tiene movimientos válidos o el tablero está lleno. |
| `get_winner()` | Retorna `1`, `-1` o `0` (empate). Solo válido si `is_terminal()`. |
| `get_score()` | `(negras, blancas)` — conteo actual de piezas. |
| `copy()` | Copia profunda del estado (necesario para búsqueda de IA sin mutar el estado real). |
| `get_phase()` | `"opening"` (≤14 fichas), `"midgame"` (15–44), `"endgame"` (≥45). Usado por heurísticas. |
| `evaluate()` | Heurística base simple: diferencia de piezas. Integrante 2 sobreescribirá/extenderá esto. |

### Lógica de volteo (núcleo del juego)

Para cada una de las 8 direcciones `(dr, dc)`:
1. Avanzar desde `(row+dr, col+dc)` mientras haya fichas enemigas.
2. Si se encuentra una ficha propia al final → voltear todas las intermedias.
3. Si se llega al borde o casilla vacía sin encontrar ficha propia → no voltear nada en esa dirección.

---

## Parte 2 — API REST con FastAPI

Archivo: `backend/api.py`

### Contratos JSON (definir el Día 1)

**GET `/game/state`**
```json
{
  "board": [[0,0,...], ...],
  "current_player": 1,
  "legal_moves": [[2,3], [3,2]],
  "score": {"black": 2, "white": 2},
  "phase": "opening",
  "is_terminal": false,
  "winner": null
}
```

**POST `/game/move`**  
Body: `{ "row": 2, "col": 3 }`  
Response: mismo formato que `/game/state`

**POST `/game/ai-move`**  
Body: `{ "algorithm": "alpha_beta", "depth": 6 }`  
Response:
```json
{
  "move": [2, 3],
  "nodes_explored": 14823,
  "time_ms": 340.5,
  "board_eval": 12.5,
  "state": { ...mismo que /game/state... }
}
```

**POST `/game/new`**  
Body: `{ "mode": "human_vs_ai" }`  
Response: estado inicial

**GET `/game/metrics`**  
Response: métricas de la última jugada IA

### Endpoints completos

| Endpoint | Método | Descripción |
|---|---|---|
| `/game/new` | POST | Nueva partida, retorna estado inicial |
| `/game/state` | GET | Estado actual |
| `/game/moves` | GET | Movimientos legales del turno actual |
| `/game/move` | POST | Aplicar movimiento humano |
| `/game/ai-move` | POST | Solicitar jugada IA (algoritmo + params) |
| `/game/metrics` | GET | Métricas de última jugada IA |

---

## Checklist de entrega

- [x] `GameEngine` instanciable con estado inicial de Othello
- [x] `get_legal_moves()` correcta en posición inicial (retorna los 4 movimientos esperados)
- [x] `apply_move()` voltea fichas correctamente en las 8 direcciones
- [x] `is_terminal()` y `get_winner()` funcionando
- [x] `copy()` produce una copia completamente independiente
- [x] `get_phase()` retorna la fase correcta: opening (≤14 fichas), midgame (15–44), endgame (≥45)
- [x] API con todos los endpoints en `localhost:8000` (arrancar con `uvicorn api:app --reload --port 8000`)
- [x] Contratos JSON definidos y disponibles en `api.py`
- [x] Tests básicos verificados: posición inicial, primer movimiento negro, copia independiente
