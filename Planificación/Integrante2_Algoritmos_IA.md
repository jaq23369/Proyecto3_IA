# Integrante 2 — Algoritmos de IA + Heurísticas

**Área:** Inteligencia Artificial — motores de búsqueda y evaluación  
**Inicia:** Cuando Integrante 1 entrega `GameEngine` con sus métodos base  
**Archivo:** `backend/algorithms.py`

---

## Parte 1 — Heurísticas de Evaluación (implementar primero)

Las heurísticas son la base de todos los algoritmos. Sin buenas heurísticas, ningún algoritmo jugará bien en Othello.

### Regla de oro
> En Othello **no** gana quien tiene más piezas a mitad del juego — gana quien controla mejor el tablero. Las esquinas son casi imbatibles.

### Heurísticas a implementar

#### H1 — Paridad de piezas
```python
# Solo útil en endgame, engañosa en opening/midgame
score = (mis_piezas - piezas_enemigas) / (mis_piezas + piezas_enemigas) * 100
```

#### H2 — Movilidad
```python
# Cuantos más movimientos tengo vs el enemigo, más control tengo
mi_mov = len(engine.get_legal_moves())
# simular turno enemigo para contar sus movimientos
score = (mi_mov - mov_enemigo) / (mi_mov + mov_enemigo + 1) * 100
```

#### H3 — Control de esquinas
```python
CORNERS = [(0,0), (0,7), (7,0), (7,7)]
# Esquinas propias +25, esquinas enemigas -25
# Las "X-squares" (diagonales a esquina) penalizan si la esquina está vacía
```

#### H4 — Estabilidad
Fichas que **nunca** pueden ser volteadas (esquinas + bordes completos + fichas interiores estables). Son las más valiosas.

#### H5 — Frontera (borde expuesto)
Fichas propias adyacentes a casillas vacías son vulnerables. Penalizarlas.

### Heurística compuesta por fase

```python
def evaluate(engine) -> float:
    phase = engine.get_phase()
    
    if phase == "opening":
        # Movilidad y esquinas dominan, ignorar conteo de piezas
        return 5*H3 + 3*H2 + 1*H4
    
    elif phase == "midgame":
        # Estabilidad se vuelve importante
        return 3*H3 + 2*H2 + 3*H4 + 1*H5
    
    else:  # endgame
        # Conteo de piezas es lo que importa al final
        return 2*H3 + 1*H2 + 2*H4 + 3*H1
```

---

## Parte 2 — Algoritmo Alpha-Beta (prioridad alta)

```python
def alpha_beta(engine, depth, alpha, beta, maximizing) -> tuple[float, tuple]:
    """
    Minimax con poda alfa-beta.
    Retorna (valor, mejor_movimiento).
    Límite de 2 segundos por jugada.
    """
```

### Optimizaciones a implementar

| Optimización | Impacto | Descripción |
|---|---|---|
| Ordenamiento de movimientos | Alto | Evaluar esquinas primero, luego bordes, luego interiores |
| Poda alfa-beta básica | Alto | No explorar ramas que no pueden mejorar el resultado |
| Ventana de aspiración | Medio | Asumir una ventana estrecha y ampliar si falla |
| Tabla de transposición | Alto | Cachear estados ya evaluados (dict con hash del tablero) |

### Profundidades recomendadas por fase

```
Opening  → depth = 4  (árbol muy ancho, demasiados movimientos)
Midgame  → depth = 6  (árbol se reduce)
Endgame  → depth = full (si quedan <12 casillas, resolver exacto)
```

---

## Parte 3 — MCTS (Monte Carlo Tree Search)

```python
def mcts(engine, time_limit_s=2.0, C=1.41) -> tuple[tuple, dict]:
    """
    Búsqueda Monte Carlo con UCT.
    Retorna (mejor_movimiento, métricas).
    """
```

### Fórmula UCT
```
Score(nodo) = victorias/visitas + C × √(ln(visitas_padre) / visitas_nodo)
```

### 4 fases de MCTS por iteración

1. **Selección** — bajar por el árbol usando UCT hasta un nodo no completamente expandido
2. **Expansión** — añadir un hijo nuevo al nodo seleccionado
3. **Simulación (rollout)** — jugar aleatoriamente hasta terminal
4. **Retropropagación** — actualizar victorias/visitas hacia la raíz

### Mejora: rollout con heurística
En lugar de movimientos completamente aleatorios en la simulación, usar la heurística H3 (esquinas) para guiar los rollouts. Mejora significativamente la calidad de MCTS.

---

## Parte 4 — Expectimax (adicional)

```python
def expectimax(engine, depth) -> tuple[float, tuple]:
    """
    Como Minimax pero el nodo del oponente es un nodo de probabilidad
    (promedio de hijos en lugar de mínimo).
    Modela un oponente que no juega perfectamente.
    """
```

Útil para el modo Humano vs IA en dificultad baja.

---

## Parte 5 — Instrumentación (obligatorio para el reporte)

Cada función debe retornar métricas:

```python
@dataclass
class AIResult:
    move: tuple[int, int]
    nodes_explored: int
    time_ms: float
    board_eval: float
    depth_reached: int
    algorithm: str
```

Llevar contador de nodos como variable compartida dentro de la función de búsqueda.

---

## Checklist de entrega

- [ ] `evaluate()` compuesta con los 3 pesos por fase
- [ ] `alpha_beta()` con poda funcional, límite de 2s respetado
- [ ] `mcts()` con UCT, `C=1.41`, límite de 2s
- [ ] `expectimax()` implementado (puede ser simplificado)
- [ ] Ordenamiento de movimientos en alpha-beta (esquinas primero)
- [ ] Tabla de transposición básica
- [ ] `AIResult` retornado por todos los algoritmos con nodos y tiempo
- [ ] Verificar que alpha-beta gana consistentemente al aleatorio
