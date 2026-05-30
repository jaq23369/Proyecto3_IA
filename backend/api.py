import time
import uuid
import random
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from game_engine import GameEngine, BLACK, WHITE

app = FastAPI(title="Othello API", version="1.0.0")

# Habilitar CORS para que React pueda consumir la API sin restricciones de origen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Almacén de partidas en memoria: game_id → GameEngine
games: dict[str, GameEngine] = {}
# Últimas métricas de IA por partida (nodos, tiempo, evaluación)
last_metrics: dict[str, dict] = {}


# ------------------------------------------------------------------
# Modelos de petición
# ------------------------------------------------------------------

class NewGameRequest(BaseModel):
    mode: str = "human_vs_human"  # human_vs_human | human_vs_ai | ai_vs_ai

class MoveRequest(BaseModel):
    row: int
    col: int

class AIMoveRequest(BaseModel):
    algorithm: str = "alpha_beta"  # alpha_beta | mcts | expectimax
    depth: int = 6                 # solo aplica a alpha_beta y expectimax


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def serialize_state(game_id: str, engine: GameEngine) -> dict[str, Any]:
    # Convierte el estado del motor al contrato JSON que consume el frontend
    black, white = engine.get_score()
    winner = engine.get_winner()
    return {
        "game_id": game_id,
        "board": engine.board_to_list(),
        "current_player": engine.current_player,
        "legal_moves": [list(m) for m in engine.get_legal_moves()],
        "score": {"black": black, "white": white},
        "phase": engine.get_phase(),
        "is_terminal": engine.is_terminal(),
        "winner": winner,
        "move_count": engine.move_count,
    }


def get_engine(game_id: str) -> GameEngine:
    engine = games.get(game_id)
    if not engine:
        raise HTTPException(status_code=404, detail=f"Partida '{game_id}' no encontrada")
    return engine


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

# Crea una nueva partida y retorna el estado inicial del tablero junto con el game_id
@app.post("/game/new")
def new_game(body: NewGameRequest):
    game_id = str(uuid.uuid4())
    games[game_id] = GameEngine()
    return serialize_state(game_id, games[game_id])


# Retorna el estado actual del tablero: piezas, turno, puntaje, fase y si la partida terminó
@app.get("/game/{game_id}/state")
def get_state(game_id: str):
    return serialize_state(game_id, get_engine(game_id))


# Retorna la lista de movimientos legales disponibles para el jugador del turno actual
@app.get("/game/{game_id}/moves")
def get_moves(game_id: str):
    engine = get_engine(game_id)
    return {"legal_moves": [list(m) for m in engine.get_legal_moves()]}


# Aplica el movimiento de un jugador humano y retorna el nuevo estado del tablero
@app.post("/game/{game_id}/move")
def make_move(game_id: str, body: MoveRequest):
    engine = get_engine(game_id)

    if engine.is_terminal():
        raise HTTPException(status_code=400, detail="La partida ya terminó")

    legal = engine.get_legal_moves()
    if (body.row, body.col) not in legal:
        raise HTTPException(
            status_code=400,
            detail=f"Movimiento ({body.row},{body.col}) no es legal. Movimientos válidos: {legal}",
        )

    engine.apply_move(body.row, body.col)
    return serialize_state(game_id, engine)


# Solicita a la IA que calcule y ejecute su jugada; retorna el movimiento, métricas y nuevo estado
@app.post("/game/{game_id}/ai-move")
def ai_move(game_id: str, body: AIMoveRequest):
    engine = get_engine(game_id)

    if engine.is_terminal():
        raise HTTPException(status_code=400, detail="La partida ya terminó")

    legal = engine.get_legal_moves()
    if not legal:
        raise HTTPException(status_code=400, detail="No hay movimientos disponibles para la IA")

    start = time.perf_counter()
    nodes_explored = 0
    depth_reached = 0

    # Usa los algoritmos de Integrante 2; movimiento aleatorio mientras no estén listos
    try:
        from algorithms import get_best_move  # type: ignore
        result = get_best_move(engine, body.algorithm, body.depth)
        move = result.move
        nodes_explored = result.nodes_explored
        depth_reached = result.depth_reached
    except (ImportError, Exception):
        move = random.choice(legal)

    elapsed_ms = (time.perf_counter() - start) * 1000
    engine.apply_move(move[0], move[1])

    metrics = {
        "move": list(move),
        "algorithm": body.algorithm,
        "depth": body.depth,
        "nodes_explored": nodes_explored,
        "time_ms": round(elapsed_ms, 2),
        "board_eval": round(engine.evaluate(), 2),
        "depth_reached": depth_reached,
    }
    last_metrics[game_id] = metrics

    return {**metrics, "state": serialize_state(game_id, engine)}


# Retorna las métricas de rendimiento del último movimiento realizado por la IA
@app.get("/game/{game_id}/metrics")
def get_metrics(game_id: str):
    get_engine(game_id)
    metrics = last_metrics.get(game_id)
    if not metrics:
        raise HTTPException(status_code=404, detail="Aún no se ha realizado ningún movimiento de IA")
    return metrics


# Elimina una partida de la memoria una vez que ha terminado
@app.delete("/game/{game_id}")
def delete_game(game_id: str):
    if game_id not in games:
        raise HTTPException(status_code=404, detail=f"Partida '{game_id}' no encontrada")
    games.pop(game_id, None)
    last_metrics.pop(game_id, None)
    return {"deleted": game_id}


# Verificación rápida de que el servidor está activo
@app.get("/")
def root():
    return {"status": "ok", "partidas_activas": len(games)}
