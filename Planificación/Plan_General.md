# Plan General — Othello (Reversi)

**Curso:** Inteligencia Artificial 2026  
**Proyecto:** Tercer Proyecto — Juegos Adversarios  
**Juego:** Othello (Reversi) — tablero 8×8  
**Stack:** Python (backend + IA) · FastAPI (API REST) · React (frontend)  
**Fecha límite:** según calendario del curso

---

## Estructura del Equipo

| Integrante | Área | Entrega |
|---|---|---|
| Integrante 1 | Motor de juego (`GameEngine`) + API | Fase 1 (base) |
| Integrante 2 | Algoritmos de IA + Heurísticas | Fase 2 (depende de Int. 1) |
| Integrante 3 | Frontend React + Análisis de Rendimiento | Fase 3 (integración final) |

---

## Cascada de Dependencias

```
Fase 1 (base)        Fase 2 (IA)           Fase 3 (integración)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INTEGRANTE 1] ──────────────────────────►
               [INTEGRANTE 2] ──────────────────────────►
[INTEGRANTE 3] ──UI estática──[conectar API]────────────►
```

> Integrante 3 puede avanzar la UI estática (tablero, componentes) usando datos mockeados mientras Integrante 1 termina el motor, y conectar la API real en cuanto esté lista.

---

## Estructura del Repositorio

```
Proyecto3_IA/
├── backend/
│   ├── game_engine.py        # Motor Othello (Integrante 1)
│   ├── algorithms.py         # IA: Alpha-Beta, MCTS, Expectimax (Integrante 2)
│   └── api.py                # FastAPI REST (Integrante 1)
├── frontend/
│   └── src/
│       ├── components/       # Board, Controls, Metrics (Integrante 3)
│       └── services/         # Llamadas a la API
├── analysis/
│   └── tournament.py         # Script torneo 20 partidas (Integrante 3)
├── Planificación/
│   ├── Plan_General.md
│   ├── Integrante1_Motor_API.md
│   ├── Integrante2_Algoritmos_IA.md
│   └── Integrante3_Frontend_Analisis.md
└── README.md
```

---

## Dependencias Críticas

```
Integrante 1 → Integrante 2 necesita:
  - GameEngine.copy()
  - GameEngine.apply_move()
  - GameEngine.is_terminal()
  - GameEngine.get_legal_moves()
  - GameEngine.evaluate()  (heurística base)

Integrante 1 → Integrante 3 necesita:
  - Contratos JSON de /game/state y /game/moves (definir desde día 1)

Integrante 2 → Integrante 3 necesita:
  - Endpoint /game/ai-move funcionando con métricas incluidas
```

---

## Entregables Finales

- [ ] Código fuente documentado en repositorio Git
- [ ] Video de demostración (3 minutos) mostrando los 3 modos de juego
- [ ] Reporte técnico en PDF con gráficas de rendimiento
