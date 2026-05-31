from __future__ import annotations

import math
import random
import time
from dataclasses import dataclass
from typing import Optional

from game_engine import BLACK, EMPTY, DIRECTIONS, GameEngine

BOARD_SIZE = 8
CORNERS = [(0, 0), (0, 7), (7, 0), (7, 7)]
X_SQUARES = {
    (0, 0): (1, 1),
    (0, 7): (1, 6),
    (7, 0): (6, 1),
    (7, 7): (6, 6),
}
POSITION_WEIGHTS = [
    [100, -20, 10, 5, 5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [5, -2, -1, -1, -1, -1, -2, 5],
    [10, -2, -1, -1, -1, -1, -2, 10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10, 5, 5, 10, -20, 100],
]


@dataclass
class AIResult:
    move: tuple[int, int]
    nodes_explored: int
    time_ms: float
    board_eval: float
    depth_reached: int
    algorithm: str


class _SearchTimeout(Exception):
    pass


def get_best_move(engine: GameEngine, algorithm: str = "alpha_beta", depth: int = 6) -> AIResult:
    normalized = algorithm.lower().replace("-", "_")
    if normalized in {"alpha_beta", "alphabeta", "ab"}:
        return alpha_beta_search(engine, depth=depth)
    if normalized == "mcts":
        return mcts(engine, time_limit_s=2.0)
    if normalized == "expectimax":
        return expectimax_search(engine, depth=depth)
    raise ValueError(f"Algoritmo no soportado: {algorithm}")


def evaluate(engine: GameEngine, player: Optional[int] = None) -> float:
    player = engine.current_player if player is None else player

    if engine.is_terminal():
        winner = engine.get_winner()
        black, white = engine.get_score()
        disc_diff = (black - white) if player == BLACK else (white - black)
        if winner == player:
            return 100000.0 + disc_diff
        if winner == -player:
            return -100000.0 + disc_diff
        return 0.0

    phase = engine.get_phase()
    parity = _piece_parity(engine, player)
    mobility = _mobility(engine, player)
    corners = _corner_control(engine, player)
    stability = _stability(engine, player)
    frontier = _frontier(engine, player)

    if phase == "opening":
        return 5 * corners + 3 * mobility + stability
    if phase == "midgame":
        return 3 * corners + 2 * mobility + 3 * stability + frontier
    return 2 * corners + mobility + 2 * stability + 3 * parity


def alpha_beta(
    engine: GameEngine,
    depth: int,
    alpha: float = -math.inf,
    beta: float = math.inf,
    maximizing: bool = True,
) -> tuple[float, Optional[tuple[int, int]]]:
    player = engine.current_player
    value, move = _alpha_beta_value(
        engine.copy(),
        depth,
        alpha,
        beta,
        player,
        None,
        {"nodes": 0},
        {},
    )
    return (value, move) if maximizing else (-value, move)


def alpha_beta_search(engine: GameEngine, depth: int = 6, time_limit_s: float = 2.0) -> AIResult:
    start = time.perf_counter()
    deadline = start + time_limit_s
    player = engine.current_player
    legal = engine.get_legal_moves()
    if not legal:
        raise ValueError("No hay movimientos legales para evaluar")

    target_depth = _recommended_depth(engine, depth)
    best_move = _order_moves(engine, legal)[0]
    best_value = -math.inf
    depth_reached = 0
    counters = {"nodes": 0}
    transposition: dict[tuple, tuple[float, Optional[tuple[int, int]]]] = {}

    for current_depth in range(1, target_depth + 1):
        try:
            value, move = _alpha_beta_value(
                engine.copy(),
                current_depth,
                -math.inf,
                math.inf,
                player,
                deadline,
                counters,
                transposition,
            )
            if move is not None:
                best_value = value
                best_move = move
                depth_reached = current_depth
        except _SearchTimeout:
            break

    elapsed_ms = (time.perf_counter() - start) * 1000
    return AIResult(
        move=best_move,
        nodes_explored=counters["nodes"],
        time_ms=round(elapsed_ms, 2),
        board_eval=round(best_value if best_value != -math.inf else evaluate(engine, player), 2),
        depth_reached=depth_reached,
        algorithm="alpha_beta",
    )


def mcts(engine: GameEngine, time_limit_s: float = 2.0, C: float = 1.41) -> AIResult:
    start = time.perf_counter()
    deadline = start + time_limit_s
    root_player = engine.current_player
    legal = engine.get_legal_moves()
    if not legal:
        raise ValueError("No hay movimientos legales para evaluar")

    root = _MCTSNode(engine.copy(), parent=None, move=None, root_player=root_player)
    iterations = 0

    while time.perf_counter() < deadline:
        node = root
        while not node.engine.is_terminal() and node.is_fully_expanded():
            node = node.best_child(C)

        if not node.engine.is_terminal():
            node = node.expand()

        reward = _rollout(node.engine.copy(), root_player, deadline)
        node.backpropagate(reward)
        iterations += 1

    if not root.children:
        best_move = random.choice(legal)
        board_eval = evaluate(engine, root_player)
    else:
        best_child = max(root.children, key=lambda child: child.visits)
        best_move = best_child.move
        board_eval = best_child.mean_reward() * 200 - 100

    elapsed_ms = (time.perf_counter() - start) * 1000
    return AIResult(
        move=best_move if best_move is not None else random.choice(legal),
        nodes_explored=iterations,
        time_ms=round(elapsed_ms, 2),
        board_eval=round(board_eval, 2),
        depth_reached=0,
        algorithm="mcts",
    )


def expectimax(engine: GameEngine, depth: int = 4) -> tuple[float, Optional[tuple[int, int]]]:
    player = engine.current_player
    return _expectimax_value(engine.copy(), depth, player, {"nodes": 0}, None)


def expectimax_search(engine: GameEngine, depth: int = 4, time_limit_s: float = 2.0) -> AIResult:
    start = time.perf_counter()
    deadline = start + time_limit_s
    player = engine.current_player
    counters = {"nodes": 0}
    target_depth = max(1, min(depth, 5))

    value, move = _expectimax_value(engine.copy(), target_depth, player, counters, deadline)
    if move is None:
        legal = engine.get_legal_moves()
        if not legal:
            raise ValueError("No hay movimientos legales para evaluar")
        move = _order_moves(engine, legal)[0]

    elapsed_ms = (time.perf_counter() - start) * 1000
    return AIResult(
        move=move,
        nodes_explored=counters["nodes"],
        time_ms=round(elapsed_ms, 2),
        board_eval=round(value, 2),
        depth_reached=target_depth,
        algorithm="expectimax",
    )


def _alpha_beta_value(
    engine: GameEngine,
    depth: int,
    alpha: float,
    beta: float,
    root_player: int,
    deadline: Optional[float],
    counters: dict[str, int],
    transposition: dict[tuple, tuple[float, Optional[tuple[int, int]]]],
) -> tuple[float, Optional[tuple[int, int]]]:
    if deadline is not None and time.perf_counter() >= deadline:
        raise _SearchTimeout

    counters["nodes"] += 1
    key = (_board_key(engine), engine.current_player, depth)
    if key in transposition:
        return transposition[key]

    if depth == 0 or engine.is_terminal():
        value = evaluate(engine, root_player)
        return value, None

    moves = engine.get_legal_moves()
    if not moves:
        passed = engine.copy()
        passed.current_player = -passed.current_player
        return _alpha_beta_value(
            passed, depth - 1, alpha, beta, root_player, deadline, counters, transposition
        )

    maximizing = engine.current_player == root_player
    best_move: Optional[tuple[int, int]] = None

    if maximizing:
        value = -math.inf
        pruned = False
        for move in _order_moves(engine, moves):
            child = engine.copy()
            child.apply_move(*move)
            score, _ = _alpha_beta_value(
                child, depth - 1, alpha, beta, root_player, deadline, counters, transposition
            )
            if score > value:
                value = score
                best_move = move
            alpha = max(alpha, value)
            if alpha >= beta:
                pruned = True
                break
    else:
        value = math.inf
        pruned = False
        for move in _order_moves(engine, moves):
            child = engine.copy()
            child.apply_move(*move)
            score, _ = _alpha_beta_value(
                child, depth - 1, alpha, beta, root_player, deadline, counters, transposition
            )
            if score < value:
                value = score
                best_move = move
            beta = min(beta, value)
            if alpha >= beta:
                pruned = True
                break

    if not pruned:
        transposition[key] = (value, best_move)
    return value, best_move


def _expectimax_value(
    engine: GameEngine,
    depth: int,
    root_player: int,
    counters: dict[str, int],
    deadline: Optional[float],
) -> tuple[float, Optional[tuple[int, int]]]:
    if deadline is not None and time.perf_counter() >= deadline:
        return evaluate(engine, root_player), None

    counters["nodes"] += 1
    if depth == 0 or engine.is_terminal():
        return evaluate(engine, root_player), None

    moves = engine.get_legal_moves()
    if not moves:
        passed = engine.copy()
        passed.current_player = -passed.current_player
        return _expectimax_value(passed, depth - 1, root_player, counters, deadline)

    ordered_moves = _order_moves(engine, moves)
    if engine.current_player == root_player:
        best_value = -math.inf
        best_move = ordered_moves[0]
        for move in ordered_moves:
            child = engine.copy()
            child.apply_move(*move)
            value, _ = _expectimax_value(child, depth - 1, root_player, counters, deadline)
            if value > best_value:
                best_value = value
                best_move = move
        return best_value, best_move

    total = 0.0
    for move in ordered_moves:
        child = engine.copy()
        child.apply_move(*move)
        value, _ = _expectimax_value(child, depth - 1, root_player, counters, deadline)
        total += value
    return total / len(ordered_moves), None


class _MCTSNode:
    def __init__(
        self,
        engine: GameEngine,
        parent: Optional["_MCTSNode"],
        move: Optional[tuple[int, int]],
        root_player: int,
    ):
        self.engine = engine
        self.parent = parent
        self.move = move
        self.root_player = root_player
        self.children: list[_MCTSNode] = []
        self.visits = 0
        self.wins = 0.0
        self.untried_moves = _order_moves(engine, engine.get_legal_moves())

    def is_fully_expanded(self) -> bool:
        return len(self.untried_moves) == 0

    def expand(self) -> "_MCTSNode":
        move = self.untried_moves.pop(0)
        child_engine = self.engine.copy()
        child_engine.apply_move(*move)
        child = _MCTSNode(child_engine, self, move, self.root_player)
        self.children.append(child)
        return child

    def best_child(self, C: float) -> "_MCTSNode":
        log_parent = math.log(max(1, self.visits))

        def score(child: _MCTSNode) -> float:
            if child.visits == 0:
                return math.inf
            exploitation = child.mean_reward()
            exploration = C * math.sqrt(log_parent / child.visits)
            return exploitation + exploration

        return max(self.children, key=score)

    def mean_reward(self) -> float:
        return self.wins / self.visits if self.visits else 0.0

    def backpropagate(self, reward: float) -> None:
        node: Optional[_MCTSNode] = self
        while node is not None:
            node.visits += 1
            node.wins += reward
            node = node.parent


def _rollout(engine: GameEngine, root_player: int, deadline: float) -> float:
    rollout_limit = 80
    steps = 0
    while not engine.is_terminal() and steps < rollout_limit and time.perf_counter() < deadline:
        moves = engine.get_legal_moves()
        if not moves:
            engine.current_player = -engine.current_player
            steps += 1
            continue
        move = _heuristic_rollout_move(engine, moves)
        engine.apply_move(*move)
        steps += 1

    if engine.is_terminal():
        winner = engine.get_winner()
        if winner == root_player:
            return 1.0
        if winner == 0:
            return 0.5
        return 0.0

    value = evaluate(engine, root_player)
    return max(0.0, min(1.0, (value + 1000.0) / 2000.0))


def _heuristic_rollout_move(engine: GameEngine, moves: list[tuple[int, int]]) -> tuple[int, int]:
    corners = [move for move in moves if move in CORNERS]
    if corners:
        return random.choice(corners)

    safe_moves = []
    for move in moves:
        if not _is_dangerous_x_square(engine, move):
            safe_moves.append(move)
    pool = safe_moves or moves
    if random.random() < 0.75:
        return _order_moves(engine, pool)[0]
    return random.choice(pool)


def _piece_parity(engine: GameEngine, player: int) -> float:
    black, white = engine.get_score()
    mine, enemy = (black, white) if player == BLACK else (white, black)
    total = mine + enemy
    return ((mine - enemy) / total * 100.0) if total else 0.0


def _mobility(engine: GameEngine, player: int) -> float:
    mine = _legal_moves_for(engine, player)
    enemy = _legal_moves_for(engine, -player)
    return (len(mine) - len(enemy)) / (len(mine) + len(enemy) + 1) * 100.0


def _corner_control(engine: GameEngine, player: int) -> float:
    score = 0.0
    for corner in CORNERS:
        row, col = corner
        occupant = engine.board[row][col]
        if occupant == player:
            score += 25.0
        elif occupant == -player:
            score -= 25.0
        else:
            x_row, x_col = X_SQUARES[corner]
            x_occupant = engine.board[x_row][x_col]
            if x_occupant == player:
                score -= 12.5
            elif x_occupant == -player:
                score += 12.5
    return score


def _stability(engine: GameEngine, player: int) -> float:
    stable: set[tuple[int, int]] = set()

    for corner in CORNERS:
        row, col = corner
        owner = engine.board[row][col]
        if owner == EMPTY:
            continue

        row_step = 1 if row == 0 else -1
        col_step = 1 if col == 0 else -1

        c = col
        while 0 <= c < BOARD_SIZE and engine.board[row][c] == owner:
            stable.add((row, c))
            c += col_step

        r = row
        while 0 <= r < BOARD_SIZE and engine.board[r][col] == owner:
            stable.add((r, col))
            r += row_step

    mine = sum(engine.board[r][c] == player for r, c in stable)
    enemy = sum(engine.board[r][c] == -player for r, c in stable)
    total = mine + enemy
    return (mine - enemy) / total * 100.0 if total else 0.0


def _frontier(engine: GameEngine, player: int) -> float:
    mine = 0
    enemy = 0
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            occupant = engine.board[row][col]
            if occupant == EMPTY:
                continue
            if _adjacent_to_empty(engine, row, col):
                if occupant == player:
                    mine += 1
                elif occupant == -player:
                    enemy += 1
    return (enemy - mine) / (mine + enemy + 1) * 100.0


def _adjacent_to_empty(engine: GameEngine, row: int, col: int) -> bool:
    for dr, dc in DIRECTIONS:
        nr, nc = row + dr, col + dc
        if 0 <= nr < BOARD_SIZE and 0 <= nc < BOARD_SIZE and engine.board[nr][nc] == EMPTY:
            return True
    return False


def _legal_moves_for(engine: GameEngine, player: int) -> list[tuple[int, int]]:
    clone = engine.copy()
    clone.current_player = player
    return clone.get_legal_moves()


def _order_moves(engine: GameEngine, moves: list[tuple[int, int]]) -> list[tuple[int, int]]:
    player = engine.current_player

    def key(move: tuple[int, int]) -> tuple[int, int, int]:
        row, col = move
        corner_bonus = 1 if move in CORNERS else 0
        edge_bonus = 1 if row in {0, 7} or col in {0, 7} else 0
        danger = 1 if _is_dangerous_x_square(engine, move) else 0
        flips = len(engine._get_flips(row, col, player))
        positional = POSITION_WEIGHTS[row][col]
        return (corner_bonus, edge_bonus - danger, positional + flips)

    return sorted(moves, key=key, reverse=True)


def _is_dangerous_x_square(engine: GameEngine, move: tuple[int, int]) -> bool:
    for corner, x_square in X_SQUARES.items():
        if move == x_square:
            row, col = corner
            return engine.board[row][col] == EMPTY
    return False


def _board_key(engine: GameEngine) -> tuple[tuple[int, ...], ...]:
    return tuple(tuple(row) for row in engine.board)


def _recommended_depth(engine: GameEngine, requested_depth: int) -> int:
    if requested_depth > 0:
        depth = requested_depth
    else:
        phase = engine.get_phase()
        depth = 4 if phase == "opening" else 6

    empty_count = sum(cell == EMPTY for row in engine.board for cell in row)
    if engine.get_phase() == "endgame" and empty_count <= 12:
        depth = max(depth, empty_count)
    return max(1, depth)
