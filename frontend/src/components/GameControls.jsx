import {
  Bot,
  Cpu,
  Pause,
  Play,
  RefreshCcw,
  Settings2,
  StepForward,
  Users,
} from 'lucide-react'
import { ALGORITHM_OPTIONS, DEPTH_OPTIONS, MODE_OPTIONS } from '../data/gameOptions'
import { normalizeAlgorithmLabel } from '../utils/gameFormat'

const MODE_ICONS = {
  human_vs_human: Users,
  human_vs_ai: Cpu,
  ai_vs_ai: Bot,
}

function AgentConfigurator({ label, player, config, onChange, disabled }) {
  const usesDepth = config.algorithm !== 'mcts'

  return (
    <div className="agent-config">
      <div className="agent-config-head">
        <Bot size={18} aria-hidden="true" />
        <span>{label}</span>
      </div>

      <label className="field-label">
        Algoritmo
        <select
          value={config.algorithm}
          disabled={disabled}
          onChange={(event) => onChange(player, { algorithm: event.target.value })}
        >
          {ALGORITHM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {usesDepth ? (
        <fieldset className="depth-group">
          <legend>Profundidad</legend>
          <div className="depth-options">
            {DEPTH_OPTIONS.map((depth) => (
              <button
                key={depth}
                type="button"
                className={config.depth === depth ? 'is-active' : ''}
                aria-pressed={config.depth === depth}
                disabled={disabled}
                onClick={() => onChange(player, { depth })}
              >
                {depth}
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <div className="budget-chip">Budget 2s</div>
      )}
    </div>
  )
}

function GameControls({
  mode,
  aiConfig,
  autoPlay,
  canStepAi,
  isThinking,
  onModeChange,
  onAiConfigChange,
  onNewGame,
  onToggleAutoPlay,
  onStepAi,
}) {
  return (
    <section className="panel controls-panel" aria-labelledby="controls-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Configuracion</p>
          <h2 id="controls-title">Modo de juego</h2>
        </div>
        <Settings2 size={20} aria-hidden="true" />
      </div>

      <div className="mode-segments" role="group" aria-label="Seleccion de modo">
        {MODE_OPTIONS.map((option) => {
          const Icon = MODE_ICONS[option.value]
          return (
            <button
              key={option.value}
              type="button"
              className={mode === option.value ? 'is-active' : ''}
              aria-pressed={mode === option.value}
              disabled={isThinking}
              onClick={() => onModeChange(option.value)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>

      <div className="controls-actions">
        <button type="button" className="primary-action" disabled={isThinking} onClick={onNewGame}>
          <RefreshCcw size={18} aria-hidden="true" />
          Nueva partida
        </button>

        {mode === 'ai_vs_ai' && (
          <button
            type="button"
            className="secondary-action"
            aria-pressed={autoPlay}
            onClick={onToggleAutoPlay}
          >
            {autoPlay ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
            {autoPlay ? 'Pausar' : 'Reanudar'}
          </button>
        )}

        <button
          type="button"
          className="icon-action"
          title="Ejecutar una jugada IA"
          aria-label="Ejecutar una jugada IA"
          disabled={!canStepAi || isThinking}
          onClick={onStepAi}
        >
          <StepForward size={19} aria-hidden="true" />
        </button>
      </div>

      <div className="agent-config-grid">
        {mode === 'ai_vs_ai' ? (
          <>
            <AgentConfigurator
              label="IA negras"
              player="black"
              config={aiConfig.black}
              disabled={isThinking}
              onChange={onAiConfigChange}
            />
            <AgentConfigurator
              label="IA blancas"
              player="white"
              config={aiConfig.white}
              disabled={isThinking}
              onChange={onAiConfigChange}
            />
          </>
        ) : (
          <AgentConfigurator
            label={`IA blancas: ${normalizeAlgorithmLabel(aiConfig.white.algorithm)}`}
            player="white"
            config={aiConfig.white}
            disabled={isThinking || mode === 'human_vs_human'}
            onChange={onAiConfigChange}
          />
        )}
      </div>
    </section>
  )
}

export default GameControls
