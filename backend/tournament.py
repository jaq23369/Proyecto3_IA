import sys
import os
import matplotlib.pyplot as plt
import numpy as np

# Agregar el backend al path para poder importar las funciones de la IA y el motor
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))
from game_engine import GameEngine, BLACK, WHITE
from algorithms import get_best_move

def run_combinatorial_explosion_analysis():
    print("--- 1. Análisis de Explosión Combinatoria ---")
    depths = [1, 2, 3, 4] # Minimax no soporta más de 4 en tiempos razonables
    nodes_minimax = []
    nodes_ab = []
    beff_minimax = []
    beff_ab = []

    engine = GameEngine()
    for d in depths:
        print(f"Evaluando profundidad {d}...")
        
        # Minimax puro
        res_mm = get_best_move(engine, algorithm="minimax", depth=d)
        nodes_minimax.append(res_mm.nodes_explored)
        beff_minimax.append(res_mm.nodes_explored ** (1/d))
        
        # Alfa-Beta
        res_ab = get_best_move(engine, algorithm="alpha_beta", depth=d)
        nodes_ab.append(res_ab.nodes_explored)
        beff_ab.append(res_ab.nodes_explored ** (1/d))

    # Gráfica 1: Nodos vs Profundidad (Escala Log)
    plt.figure(figsize=(8, 5))
    plt.plot(depths, nodes_minimax, marker='o', label="Minimax Puro", color='red')
    plt.plot(depths, nodes_ab, marker='s', label="Poda Alfa-Beta", color='blue')
    plt.yscale("log")
    plt.xlabel("Profundidad (d)")
    plt.ylabel("Nodos Explorados (Log)")
    plt.title("Crecimiento de Nodos vs Profundidad")
    plt.legend()
    plt.grid(True, which="both", ls="--", alpha=0.5)
    plt.savefig("nodos_vs_profundidad.png", bbox_inches='tight')
    plt.close()

    # Gráfica 2: Factor de ramificación efectivo (b_eff)
    plt.figure(figsize=(8, 5))
    plt.plot(depths, beff_minimax, marker='o', label="Minimax b_eff", color='red')
    plt.plot(depths, beff_ab, marker='s', label="Alfa-Beta b_eff", color='blue')
    plt.xlabel("Profundidad (d)")
    plt.ylabel("Factor de Ramificación Efectivo (b_eff)")
    plt.title("Factor de Ramificación Efectivo por Profundidad")
    plt.legend()
    plt.grid(True, ls="--", alpha=0.5)
    plt.savefig("b_eff.png", bbox_inches='tight')
    plt.close()
    print("Gráficas de explosión generadas.\n")


def run_tournament():
    print("--- 2. Torneo de Algoritmos (20 Partidas) ---")
    games_to_play = 20
    results = {"AB_wins": 0, "MCTS_wins": 0, "draws": 0}
    
    times_ab = []
    times_mcts = []

    for i in range(games_to_play):
        print(f"Jugando partida {i+1}/{games_to_play}...")
        engine = GameEngine()
        
        # Alternar quién es negras y blancas
        ab_is_black = (i % 2 == 0)
        player_ab = BLACK if ab_is_black else WHITE
        player_mcts = WHITE if ab_is_black else BLACK

        while not engine.is_terminal():
            current_p = engine.current_player
            if not engine.get_legal_moves():
                engine.passed_last = True
                engine.current_player = -current_p
                if engine.is_terminal(): break
                continue

            if current_p == player_ab:
                res = get_best_move(engine, algorithm="alpha_beta", depth=6)
                times_ab.append(res.time_ms)
            else:
                res = get_best_move(engine, algorithm="mcts")
                times_mcts.append(res.time_ms)
            
            engine.apply_move(*res.move)
        
        winner = engine.get_winner()
        if winner == player_ab:
            results["AB_wins"] += 1
        elif winner == player_mcts:
            results["MCTS_wins"] += 1
        else:
            results["draws"] += 1
            
    # Gráfica 3: Barras de Victorias
    plt.figure(figsize=(6, 5))
    labels = ['Alfa-Beta', 'MCTS', 'Empates']
    values = [results["AB_wins"], results["MCTS_wins"], results["draws"]]
    plt.bar(labels, values, color=['blue', 'green', 'gray'])
    plt.ylabel("Cantidad de Partidas")
    plt.title(f"Resultados del Torneo ({games_to_play} partidas)")
    plt.savefig("torneo_victorias.png", bbox_inches='tight')
    plt.close()

    # Gráfica 4: Histograma de Tiempos
    plt.figure(figsize=(8, 5))
    plt.hist(times_ab, bins=20, alpha=0.6, label="Alfa-Beta", color='blue')
    plt.hist(times_mcts, bins=20, alpha=0.6, label="MCTS", color='green')
    plt.xlabel("Tiempo de procesamiento por jugada (ms)")
    plt.ylabel("Frecuencia (Cantidad de jugadas)")
    plt.title("Distribución de Tiempos de Decisión")
    plt.legend()
    plt.savefig("distribucion_tiempos.png", bbox_inches='tight')
    plt.close()

    print(f"\nResultados del Torneo:")
    print(f"Alfa-Beta Victorias: {results['AB_wins']}")
    print(f"MCTS Victorias: {results['MCTS_wins']}")
    print(f"Empates: {results['draws']}")
    print(f"Tiempo Promedio AB: {np.mean(times_ab):.2f} ms")
    print(f"Tiempo Promedio MCTS: {np.mean(times_mcts):.2f} ms")


if __name__ == "__main__":
    # Requerirá tener 'matplotlib' y 'numpy' instalados (pip install matplotlib numpy)
    run_combinatorial_explosion_analysis()
    run_tournament()