# Inteligencia Artificial 2026

# Tercer Proyecto

11.mayo.2026

# Juegos Adversarios

El objetivo de este proyecto es diseñar e implementar un agente inteligente capaz de competir en juegos de suma cero y de información perfecta. Se pondrán a prueba algoritmos deterministas y probabilísticos para analizar su desempeño en entornos de alta complejidad combinatoria.

Los estudiantes deberán elegir una de las siguientes opciones para su implementación:

- **Othello (Reversi):** Tablero de 8 × 8, con enfoque en control de esquinas y movilidad.
- **Checkers (Damas):** Tablero de 8 × 8, juego de Damas con saltos obligatorios y promoción a "reinas".

# 1 Requerimientos Técnicos

Se requiere la implementación de un motor de juego dividido en dos componentes principales, garantizando una separación total entre la lógica de decisión y la interfaz visual.

## 1.1 Clase GameEngine

Esta clase representa el núcleo del juego. Debe gestionar el estado del tablero, las reglas y los algoritmos de búsqueda.

- `get_legal_moves()`: Retorna los movimientos válidos según el estado actual.
- `evaluate()`: Función heurística que asigna un valor numérico a estados no terminales.
- `alpha_beta(depth, alpha, beta)`: Minimax optimizado con poda para manejar el árbol de búsqueda.
- `expectimax(depth)`: Variante para modelar comportamientos subóptimos o incertidumbre en el oponente.
- `mcts(iterations, C)`: Búsqueda por Montecarlo utilizando la fórmula UCT:

```text
Score = mean win rate + C × √(log(ParentVisits) / NodeVisits)
```

Pueden implementar variantes o mejoras de los algoritmos anteriores, o pueden implementar otros algoritmos que no hayamos visto en el curso desde que quede constancia en el reporte de la explicación y funcionamiento lógico de estos otros algoritmos inteligentes.

Podrán desarrollar e investigar algoritmos hallados en cualquier fuente de información disponible, pero la implementación deberá ser propia. (Sugerencia: implementar diferentes alternativas como equipo, y al final presentar la(s) mejor(es).

**Nota:** No es obligatorio implementar todas estas funciones. La idea es que ustedes construyan los métodos que consideren necesarios o convenientes para la implementación de su Clase GameEngine.

## 1.2 Clase GameVisualizer

A diferencia de los laboratorios previos, este proyecto requiere una interfaz gráfica (GUI) (usando Pygame, Tkinter o similar) que permita:

- Visualizar el movimiento de las piezas en tiempo real.
- Mostrar indicadores de rendimiento de la IA (nodos explorados, tiempo por jugada y valoración del tablero).
- Selección de modos: Humano vs. Humano, Humano vs. IA, e IA vs. IA.
- (Opcional) Selección de dificultad, en el caso de la IA.

# 2 Análisis de Rendimiento

Deberán entregar un reporte técnico que incluya:

1. **Explosión Combinatoria:** Comparar el crecimiento de nodos visitados entre Minimax puro (si es viable a baja profundidad) vs. Alfa-Beta. Calcular el factor de ramificación efectivo:

```text
beff = raíz(depth, nodos totales)
```

2. **Duelo de Algoritmos (IA-IA):** Realizar un torneo de 20 partidas entre:

   - Agente A: Alpha-Beta con profundidad fija optimizada.
   - Agente B: MCTS con un presupuesto de simulaciones equivalente en tiempo.

En todos los casos, vamos a imponer una límite estricto de 2 segundos por jugada.

Analizar métricas de victoria, empate y eficiencia temporal.

# 3 Entregables

- Código fuente documentado en un repositorio de Git.
- Video de demostración de 3 minutos mostrando los modos de juego.
- Reporte técnico en formato PDF con gráficas de rendimiento.

# Observaciones Adicionales

Puntos clave que pueden ser de utilidad:

- A diferencia del Tic-Tac-Toe, en Othello o Damas no basta con llegar al final del árbol. Se debe implementar heurísticas de forma obligada.
- Investigar estrategias reales que utilizan los competidores de alto nivel, para idear o basar sus heurísticas.
- Pensar en la posibilidad de realizar algoritmos combinados, o heurísticas combinadas. Las estrategias cambian dependiendo de la fase del juego:

  - Apertura o Fase inicial (primeras 10 ó 15 jugadas)
  - Juego medio
  - Cierre o final (últimas 10 ó 15 jugadas)

Para implementar un motor competitivo, probablemente se deba diseñar una estrategia distinta en cada fase de juego.

Considerar que al inicio el árbol de búsqueda es demasiado amplio y grande, mientras que en la fase final, este árbol ya está bastante reducido.

# Reglas

# Othello (también conocido como Reversi)

Es un juego de mesa estratégico para dos jugadores.

## 1. Tablero y fichas

El juego se juega en un tablero de 8x8 casillas. Cada jugador tiene fichas de un color: uno juega con fichas negras y el otro con fichas blancas. Las fichas son bicolores, con un lado negro y el otro blanco. Al comienzo del juego, hay dos fichas negras y dos blancas colocadas en el centro del tablero en una disposición diagonal (las negras en d5 y e4, y las blancas en d4 y e5).

## 2. Objetivo

El objetivo del juego es tener más fichas de tu color que las del oponente al final del juego.

## 3. Turnos

Los jugadores se turnan para jugar, comenzando con el jugador que tiene las fichas negras.

## 4. Movimientos

En cada turno, un jugador debe colocar una ficha en el tablero de manera que encierre una o más de las fichas del oponente entre la ficha recién colocada y otra ficha del mismo color que ya esté en el tablero.

Las fichas pueden ser encerradas en horizontal, vertical o diagonal. Todas las fichas del oponente que queden encerradas entre dos fichas del jugador se voltean, cambiando de color para convertirse en fichas del jugador que hizo el movimiento.

## 5. Colocación válida

Un movimiento es válido si al menos una ficha del oponente es volteada como resultado del movimiento.

Si un jugador no tiene movimientos válidos, pierde su turno y el oponente juega de nuevo. Si ambos jugadores no tienen movimientos válidos, el juego termina.

## 6. Final del juego

El juego termina cuando el tablero está lleno o ninguno de los jugadores puede realizar un movimiento válido.

El jugador con más fichas de su color al final del juego es el ganador.

## 7. Reglas adicionales

- No se permite pasar turno si hay movimientos válidos disponibles.
- Es obligatorio voltear todas las fichas del oponente que queden encerradas entre las fichas del jugador que realizó el movimiento.

# Damas

Es un juego de mesa estratégico para dos jugadores, centrado en el movimiento diagonal y la captura de piezas contrarias.

## 1. Tablero y fichas

- El juego se desarrolla en un tablero de 8 × 8 casillas, donde se alternan colores claros y oscuros.
- Cada jugador comienza con 12 fichas de su color (blancas o negras).
- Las fichas se colocan exclusivamente en las casillas oscuras de las tres filas más próximas a cada jugador.
- El tablero debe orientarse de modo que la casilla de la esquina inferior derecha de cada jugador sea de color claro.

## 2. Objetivo

El objetivo del juego es capturar todas las fichas del oponente o bloquearlas de tal manera que no puedan realizar ningún movimiento válido.

## 3. Turnos

Los jugadores se turnan para realizar sus movimientos. Según las reglas internacionales, el jugador que tiene las fichas blancas realiza el primer movimiento de la partida.

## 4. Movimientos

- **Peones:** Se mueven una casilla hacia adelante en diagonal hacia una casilla vacía.
- **Captura:** Si una ficha contraria está en una casilla diagonal adyacente y la casilla inmediatamente siguiente en esa dirección está vacía, el jugador debe saltar sobre la pieza enemiga y retirarla del tablero.
- **Capturas múltiples:** Si tras un salto la misma pieza puede realizar otra captura, debe continuar saltando en el mismo turno.

## 5. Colocación válida y Coronación

- Un movimiento es válido si se desplaza a una casilla vacía en diagonal o si realiza una captura reglamentaria.
- **Coronación (Dama):** Cuando un peón alcanza la última fila del lado opuesto, se corona y se convierte en “Dama” (usualmente colocando una segunda ficha encima).
- Las Damas pueden moverse y capturar tanto hacia adelante como hacia atrás en diagonal, aumentando significativamente su rango de acción.

## 6. Final del juego

- Un jugador pierde todas sus fichas.
- Un jugador no puede realizar ningún movimiento porque todas sus piezas están bloqueadas.
- Se acuerda un empate cuando ninguno de los jugadores puede forzar la victoria.

## 7. Reglas adicionales

- **Obligación de comer:** Si existe una captura disponible, es obligatorio realizarla. No se puede optar por un movimiento simple si se puede capturar.
- **Soplo (opcional/tradicional):** En algunas variantes antiguas, si un jugador no veía una captura, el oponente podía retirar la pieza que no capturó, aunque en el juego moderno profesional la captura es obligatoria.
