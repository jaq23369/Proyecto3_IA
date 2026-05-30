from __future__ import annotations
from typing import Optional

BLACK = 1
WHITE = -1
EMPTY = 0

# Las 8 direcciones posibles: horizontales, verticales y diagonales
DIRECTIONS = [(-1, -1), (-1, 0), (-1, 1),
              ( 0, -1),          ( 0, 1),
              ( 1, -1), ( 1, 0), ( 1, 1)]


class GameEngine:
    def __init__(self):
        self.board: list[list[int]] = [[EMPTY] * 8 for _ in range(8)]
        # Posición inicial estándar de Othello
        self.board[3][3] = WHITE
        self.board[3][4] = BLACK
        self.board[4][3] = BLACK
        self.board[4][4] = WHITE
        self.current_player: int = BLACK  # las negras siempre mueven primero
        self.move_count: int = 0
        self.last_move: Optional[tuple[int, int]] = None
        self.passed_last: bool = False  # True si el turno anterior fue un pase forzado

    # ------------------------------------------------------------------
    # Interfaz pública
    # ------------------------------------------------------------------

    def get_legal_moves(self) -> list[tuple[int, int]]:
        return [
            (r, c)
            for r in range(8)
            for c in range(8)
            if self.board[r][c] == EMPTY and self._get_flips(r, c, self.current_player)
        ]

    def apply_move(self, row: int, col: int) -> GameEngine:
        if self.board[row][col] != EMPTY:
            raise ValueError(f"La celda ({row},{col}) está ocupada")

        flips = self._get_flips(row, col, self.current_player)
        if not flips:
            raise ValueError(f"El movimiento ({row},{col}) es ilegal — no voltea ninguna ficha")

        # Colocar ficha y voltear todas las enemigas encerradas
        self.board[row][col] = self.current_player
        for r, c in flips:
            self.board[r][c] = self.current_player

        self.last_move = (row, col)
        self.move_count += 1

        # Cambiar turno; si el oponente no tiene movimientos, el jugador actual repite
        opponent = -self.current_player
        if self._has_any_move(opponent):
            self.current_player = opponent
            self.passed_last = False
        elif self._has_any_move(self.current_player):
            # Pase forzado: el oponente no puede mover
            self.passed_last = True
        else:
            # Ninguno puede mover — fin del juego
            self.passed_last = True

        return self

    def is_terminal(self) -> bool:
        if all(self.board[r][c] != EMPTY for r in range(8) for c in range(8)):
            return True
        return not self._has_any_move(BLACK) and not self._has_any_move(WHITE)

    def get_winner(self) -> Optional[int]:
        if not self.is_terminal():
            return None
        black, white = self.get_score()
        if black > white:
            return BLACK
        if white > black:
            return WHITE
        return 0  # empate

    def get_score(self) -> tuple[int, int]:
        black = sum(self.board[r][c] == BLACK for r in range(8) for c in range(8))
        white = sum(self.board[r][c] == WHITE for r in range(8) for c in range(8))
        return black, white

    def get_phase(self) -> str:
        total_pieces = sum(self.board[r][c] != EMPTY for r in range(8) for c in range(8))
        if total_pieces <= 14:
            return "opening"
        if total_pieces <= 44:
            return "midgame"
        return "endgame"

    def evaluate(self) -> float:
        # Heurística base: diferencia de piezas normalizada desde la perspectiva de BLACK
        black, white = self.get_score()
        total = black + white
        if total == 0:
            return 0.0
        return (black - white) / total * 100.0

    def copy(self) -> GameEngine:
        # Copia sin llamar a __init__ para evitar reinicializar el tablero
        clone = GameEngine.__new__(GameEngine)
        clone.board = [row[:] for row in self.board]
        clone.current_player = self.current_player
        clone.move_count = self.move_count
        clone.last_move = self.last_move
        clone.passed_last = self.passed_last
        return clone

    def board_to_list(self) -> list[list[int]]:
        return [row[:] for row in self.board]

    # ------------------------------------------------------------------
    # Helpers privados
    # ------------------------------------------------------------------

    def _get_flips(self, row: int, col: int, player: int) -> list[tuple[int, int]]:
        # Acumula todas las fichas enemigas a voltear en las 8 direcciones
        all_flips: list[tuple[int, int]] = []
        for dr, dc in DIRECTIONS:
            all_flips.extend(self._flips_in_direction(row, col, player, dr, dc))
        return all_flips

    def _flips_in_direction(
        self, row: int, col: int, player: int, dr: int, dc: int
    ) -> list[tuple[int, int]]:
        enemy = -player
        candidates: list[tuple[int, int]] = []
        r, c = row + dr, col + dc
        while 0 <= r < 8 and 0 <= c < 8 and self.board[r][c] == enemy:
            candidates.append((r, c))
            r += dr
            c += dc
        # Solo se voltea si la cadena de enemigos termina en una ficha propia
        if candidates and 0 <= r < 8 and 0 <= c < 8 and self.board[r][c] == player:
            return candidates
        return []

    def _has_any_move(self, player: int) -> bool:
        for r in range(8):
            for c in range(8):
                if self.board[r][c] == EMPTY and self._get_flips(r, c, player):
                    return True
        return False

    # ------------------------------------------------------------------
    # Debug
    # ------------------------------------------------------------------

    def __str__(self) -> str:
        symbols = {BLACK: "B", WHITE: "W", EMPTY: "."}
        rows = ["  0 1 2 3 4 5 6 7"]
        for i, row in enumerate(self.board):
            rows.append(f"{i} " + " ".join(symbols[c] for c in row))
        black, white = self.get_score()
        rows.append(f"Black: {black}  White: {white}  Turno: {'B' if self.current_player == BLACK else 'W'}")
        return "\n".join(rows)
