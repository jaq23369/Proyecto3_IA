import { AlertTriangle, Wifi, WifiOff, X, Zap } from 'lucide-react'

function StatusBar({ source, status, error, isThinking, onDismissError }) {
  const SourceIcon = source === 'api' ? Wifi : WifiOff

  return (
    <div className="status-bar" aria-live="polite">
      <div className="status-item">
        <SourceIcon size={17} aria-hidden="true" />
        <span>{source === 'api' ? 'API FastAPI' : 'Mocks locales'}</span>
      </div>
      <div className="status-item">
        <Zap size={17} aria-hidden="true" />
        <span>{isThinking ? 'IA calculando' : status}</span>
      </div>
      {error && (
        <div className="status-error" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          <span>{error}</span>
          <button type="button" aria-label="Cerrar error" onClick={onDismissError}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}

export default StatusBar
