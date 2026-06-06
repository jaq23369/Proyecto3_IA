# Proyecto 3 IA - Othello Arena

Proyecto de Juegos Adversarios para el curso de Inteligencia Artificial 2026. El sistema implementa un agente inteligente para Othello/Reversi en tablero 8x8, con motor de reglas en Python, API REST con FastAPI, frontend en React y analisis de rendimiento entre algoritmos de busqueda.

## Resumen

Othello Arena permite jugar y observar partidas en tres modos:

- Humano vs Humano
- Humano vs IA
- IA vs IA

El frontend muestra el tablero, movimientos legales, marcador, historial de jugadas y metricas de rendimiento de la IA. El backend contiene el motor del juego y los algoritmos inteligentes. El script de torneo genera las graficas usadas en el informe tecnico.

## Arquitectura

```text
Proyecto3_IA/
├── backend/
│   ├── game_engine.py      # Reglas de Othello y estado del tablero
│   ├── algorithms.py       # Minimax, Alpha-Beta, Expectimax y MCTS
│   ├── api.py              # API REST con FastAPI
│   ├── tournament.py       # Torneo IA vs IA y graficas de rendimiento
│   └── requirements.txt    # Dependencias especificas de API
├── frontend/
│   ├── src/
│   │   ├── components/     # Tablero, controles, marcador, metricas
│   │   ├── services/       # Cliente API y servicio mock
│   │   ├── data/           # Opciones de modo y algoritmos
│   │   └── utils/          # Formateo de jugadas y metricas
│   └── package.json
├── Informe/
│   ├── informe_tecnico_mejorado.tex
│   ├── nodos_vs_profundidad.png
│   ├── b_eff.png
│   ├── torneo_victorias.png
│   └── distribucion_tiempos.png
├── Instrucciones/
├── Planificación/
└── requirements.txt        # Dependencias generales del proyecto
```

## Requisitos

- Python 3.11 o superior
- Node.js 20.19 o superior, o Node.js 22.12 o superior
- npm

## Instalacion Del Backend

Desde la raiz del proyecto:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

El archivo `requirements.txt` de la raiz incluye tanto las dependencias de la API como las necesarias para generar graficas:

- `fastapi`
- `uvicorn`
- `pydantic`
- `matplotlib`
- `numpy`

## Levantar El Backend

```bash
cd backend
../.venv/bin/python -m uvicorn api:app --reload --port 8000
```

La API queda disponible en:

```text
http://localhost:8000
```

Prueba rapida:

```bash
curl http://localhost:8000/
```

Respuesta esperada:

```json
{"status":"ok","partidas_activas":0}
```

## Instalacion Del Frontend

En otra terminal:

```bash
cd frontend
npm install
```

## Levantar El Frontend

Modo mock local, util para ver la interfaz sin backend:

```bash
npm run dev
```

Modo conectado al backend real:

```bash
VITE_USE_MOCKS=false VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

Luego abrir la URL que muestra Vite, normalmente:

```text
http://localhost:5173
```

Importante: por defecto el frontend usa mocks locales. Para demostrar el proyecto completo con FastAPI, usar `VITE_USE_MOCKS=false`.

## Comandos Utiles

Backend:

```bash
.venv/bin/python -m compileall backend
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

## API Principal

La API guarda partidas en memoria usando un `game_id`.

| Metodo | Ruta | Descripcion |
|---|---|---|
| `POST` | `/game/new` | Crea una nueva partida |
| `GET` | `/game/{game_id}/state` | Retorna estado actual |
| `GET` | `/game/{game_id}/moves` | Retorna movimientos legales |
| `POST` | `/game/{game_id}/move` | Aplica movimiento humano |
| `POST` | `/game/{game_id}/ai-move` | Calcula y aplica una jugada IA |
| `GET` | `/game/{game_id}/metrics` | Retorna metricas de la ultima jugada IA |
| `DELETE` | `/game/{game_id}` | Elimina una partida |

Ejemplo de nueva partida:

```bash
curl -X POST http://localhost:8000/game/new \
  -H "Content-Type: application/json" \
  -d '{"mode":"human_vs_ai"}'
```

Ejemplo de jugada IA:

```bash
curl -X POST http://localhost:8000/game/<game_id>/ai-move \
  -H "Content-Type: application/json" \
  -d '{"algorithm":"alpha_beta","depth":6}'
```

## Motor De Juego

El motor esta en `backend/game_engine.py` y representa el tablero como una matriz 8x8:

```text
0  = casilla vacia
1  = ficha negra
-1 = ficha blanca
```

Responsabilidades principales:

- Inicializar la posicion estandar de Othello
- Calcular movimientos legales
- Aplicar movimientos y voltear fichas
- Manejar pases forzados
- Detectar fin de partida
- Calcular ganador y marcador
- Crear copias profundas del estado para busqueda IA
- Determinar fase del juego: apertura, juego medio o final

## Algoritmos De IA

Los algoritmos estan en `backend/algorithms.py`.

### Minimax

Se usa como linea base para comparar la explosion combinatoria. Explora el arbol de juego sin poda, por lo que su costo crece rapidamente.

### Poda Alfa-Beta

Algoritmo principal del agente. Aplica Minimax con poda y ordenamiento de movimientos para reducir nodos explorados. El ordenamiento favorece:

- Esquinas
- Bordes
- Movimientos con mayor valor posicional
- Evitar casillas peligrosas cercanas a esquinas vacias

Tambien usa limite temporal de 2 segundos, profundidad objetivo y tabla de transposicion basica.

### MCTS

Monte Carlo Tree Search usa seleccion UCT con constante `C=1.41` y presupuesto temporal de 2 segundos por jugada. Sus rollouts estan guiados por una politica heuristica que prioriza esquinas y evita movimientos peligrosos cuando es posible.

### Expectimax

Modelo alternativo para representar oponentes suboptimos o decisiones probabilisticas. Es util para dificultades mas bajas o comportamiento menos determinista.

## Heuristica

La funcion de evaluacion combina criterios estrategicos de Othello:

- Control de esquinas
- Movilidad
- Estabilidad
- Frontera
- Paridad

Los pesos cambian segun la fase:

- Apertura: movilidad y esquinas
- Juego medio: estabilidad, movilidad y control posicional
- Final: paridad y estabilidad

Esto evita que el agente tome malas decisiones basadas solo en cantidad de fichas durante la apertura.

## Analisis De Rendimiento

El archivo `backend/tournament.py` genera las graficas del informe tecnico:

```bash
source .venv/bin/activate
python backend/tournament.py
```

Este script realiza dos experimentos:

1. Comparacion de nodos explorados entre Minimax puro y Alfa-Beta.
2. Torneo automatizado de 20 partidas entre Alfa-Beta y MCTS.

En la corrida registrada para el informe:

```text
Alfa-Beta Victorias: 20
MCTS Victorias: 0
Empates: 0
Tiempo Promedio AB: 1093.30 ms
Tiempo Promedio MCTS: 2000.16 ms
```

Imagenes del informe:

| Archivo | Descripcion |
|---|---|
| `nodos_vs_profundidad.png` | Nodos explorados vs profundidad |
| `b_eff.png` | Factor de ramificacion efectivo |
| `torneo_victorias.png` | Resultados del torneo |
| `distribucion_tiempos.png` | Histograma de tiempos por jugada |

Nota: `tournament.py` guarda las imagenes en el directorio desde el cual se ejecuta. Las imagenes usadas para el informe estan en `Informe/`.

## Informe Tecnico

El informe mejorado esta en:

```text
Informe/informe_tecnico_mejorado.tex
```

Para compilarlo en Overleaf, subir al proyecto estos archivos:

```text
LOGOUVG.png
nodos_vs_profundidad.png
b_eff.png
torneo_victorias.png
distribucion_tiempos.png
```

## Flujo Recomendado Para Replicar

1. Crear entorno virtual de Python.
2. Instalar dependencias con `pip install -r requirements.txt`.
3. Levantar backend con Uvicorn.
4. Instalar dependencias del frontend con `npm install`.
5. Levantar frontend con `VITE_USE_MOCKS=false`.
6. Probar modo Humano vs IA o IA vs IA.
7. Ejecutar `python backend/tournament.py` para regenerar metricas y graficas.
8. Subir las imagenes al informe en Overleaf.

## Verificacion Rapida

Estos comandos fueron usados para comprobar que el proyecto sigue funcionando:

```bash
.venv/bin/python -m compileall backend
cd frontend
npm run lint
npm run build
```

Resultado esperado:

- El backend compila sin errores.
- ESLint no reporta problemas.
- Vite genera el build correctamente.

## Integrantes

- Joel Jaquez - Carne 23369
- Diego Patzan - Carne 23525
- Luis Gonzalez - Carne 23353

