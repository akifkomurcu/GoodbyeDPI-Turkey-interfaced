import type { LogEntry } from "../types";

interface LogConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function LogConsole({ logs, onClear }: LogConsoleProps) {
  return (
    <section className="panel log-panel">
      <div className="panel__header">
        <div>
          <h2>Log</h2>
          <p>Son durum mesajlari ve GoodbyeDPI ciktilari.</p>
        </div>
        <button type="button" className="secondary-button" onClick={onClear}>
          Temizle
        </button>
      </div>
      <div className="log-console" role="log" aria-live="polite">
        {logs.length === 0 ? (
          <p className="log-console__empty">Henuz log yok. Baslat dugmesiyle sureci baslatabilirsiniz.</p>
        ) : (
          logs.map((entry, index) => (
            <div key={`${entry.timestamp}-${index}`} className={`log-line log-line--${entry.stream}`}>
              <span>[{new Date(Number(entry.timestamp)).toLocaleTimeString("tr-TR")}]</span>
              <strong>{entry.stream.toUpperCase()}</strong>
              <p>{entry.message}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
