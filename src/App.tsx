import { useEffect, useMemo, useState } from "react";
import { LogConsole } from "./components/LogConsole";
import { PresetCard } from "./components/PresetCard";
import { SettingsPanel } from "./components/SettingsPanel";
import {
  getStatus,
  listPresets,
  loadSettings,
  onLog,
  onStatus,
  saveSettings,
  startGoodbyeDpi,
  stopGoodbyeDpi
} from "./lib/tauri";
import type { AppSettings, LogEntry, Preset, RuntimeStatus } from "./types";

type View = "home" | "presets" | "logs" | "settings";

const initialSettings: AppSettings = {
  selectedPreset: "turkey-dnsredir",
  runOnLaunch: false,
  rememberLastPreset: true,
  language: "tr",
  autoRetry: false,
  requireAdmin: true,
  minimizeToTray: true
};

const initialStatus: RuntimeStatus = {
  state: "stopped",
  activePresetId: null,
  pid: null,
  lastError: null,
  resourcePath: null
};

function getInitialTheme(): "dark" | "light" {
  try {
    const stored = localStorage.getItem("gdpi-theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // ignore
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function App() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [status, setStatus] = useState<RuntimeStatus>(initialStatus);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [view, setView] = useState<View>("home");
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("gdpi-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    let active = true;
    let logUnlisten: (() => void) | undefined;
    let statusUnlisten: (() => void) | undefined;

    async function bootstrap() {
      try {
        const [availablePresets, storedSettings, runtimeStatus] = await Promise.all([
          listPresets(),
          loadSettings(),
          getStatus()
        ]);

        if (!active) return;

        setPresets(availablePresets);
        setSettings(storedSettings);
        setStatus(runtimeStatus);

        logUnlisten = await onLog((entry) => {
          setLogs((current) => [...current.slice(-149), entry]);
        });

        statusUnlisten = await onStatus((nextStatus) => {
          setStatus(nextStatus);
        });
      } catch (error) {
        setStatus({
          state: "error",
          activePresetId: null,
          pid: null,
          lastError: error instanceof Error ? error.message : String(error),
          resourcePath: null
        });
      } finally {
        if (active) setBusy(false);
      }
    }

    bootstrap();

    return () => {
      active = false;
      logUnlisten?.();
      statusUnlisten?.();
    };
  }, []);

  const selectedPreset = useMemo(
    () => presets.find((p) => p.id === settings.selectedPreset) ?? presets[0],
    [presets, settings.selectedPreset]
  );

  async function persistSettings(nextSettings: AppSettings) {
    setSettings(nextSettings);
    try {
      await saveSettings(nextSettings);
    } catch (error) {
      setLogs((current) => [
        ...current,
        {
          timestamp: String(Date.now()),
          stream: "system",
          message: `Ayarlar kaydedilemedi: ${error instanceof Error ? error.message : String(error)}`
        }
      ]);
    }
  }

  function pushSystemLog(message: string) {
    setLogs((current) => [
      ...current,
      { timestamp: String(Date.now()), stream: "system", message }
    ]);
  }

  async function handleStart(presetId = selectedPreset?.id) {
    if (!presetId) return;
    setActionPending(true);
    try {
      const nextStatus = await startGoodbyeDpi(presetId);
      setStatus(nextStatus);
      if (settings.selectedPreset !== presetId) {
        await persistSettings({ ...settings, selectedPreset: presetId });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus((current) => ({ ...current, state: "error", lastError: message }));
      pushSystemLog(`Başlatma hatası: ${message}`);
    } finally {
      setActionPending(false);
    }
  }

  async function handleStop() {
    setActionPending(true);
    try {
      const nextStatus = await stopGoodbyeDpi();
      setStatus(nextStatus);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus((current) => ({ ...current, state: "error", lastError: message }));
      pushSystemLog(`Durdurma hatası: ${message}`);
    } finally {
      setActionPending(false);
    }
  }

  const canStart = !busy && !actionPending && status.state !== "running" && !!selectedPreset;
  const canStop = !busy && !actionPending && status.state === "running";

  function toggleView(target: "presets" | "logs" | "settings") {
    setView((v) => (v === target ? "home" : target));
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar__left">
          <button
            type="button"
            className="navbar__brand"
            onClick={() => setView("home")}
          >
            GoodbyeDPI
          </button>
          <div className="navbar__divider" />
          <button
            type="button"
            className={`nav-btn${view === "presets" ? " nav-btn--active" : ""}`}
            onClick={() => toggleView("presets")}
          >
            Presetler
          </button>
          <button
            type="button"
            className={`nav-btn${view === "logs" ? " nav-btn--active" : ""}`}
            onClick={() => toggleView("logs")}
          >
            Loglar
          </button>
          <button
            type="button"
            className={`nav-btn${view === "settings" ? " nav-btn--active" : ""}`}
            onClick={() => toggleView("settings")}
          >
            Ayarlar
          </button>
        </div>
        <div className="navbar__right">
          <button
            type="button"
            className="nav-btn"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <span
            className={`online-dot online-dot--${status.state}`}
            title={
              status.state === "running"
                ? "Çalışıyor"
                : status.state === "error"
                  ? "Hata"
                  : "Hazır"
            }
          />
        </div>
      </nav>

      {view === "home" && (
        <main className="home">
          {busy ? (
            <span className="home__loading">Yükleniyor...</span>
          ) : (
            <>
              <button
                type="button"
                className={`power-btn power-btn--${status.state}`}
                onClick={() =>
                  void (status.state === "running" ? handleStop() : handleStart())
                }
                disabled={busy || actionPending || (!canStart && !canStop)}
              >
                {actionPending
                  ? "..."
                  : status.state === "running"
                    ? "Durdur"
                    : "Başlat"}
              </button>
              <div className="home__info">
                <span className="info-preset">
                  {selectedPreset?.label ?? "Preset seçilmedi"}
                </span>
                {status.pid != null && (
                  <span className="info-pid">PID {status.pid}</span>
                )}
              </div>
              {status.lastError && (
                <p className="home__error">{status.lastError}</p>
              )}
            </>
          )}
        </main>
      )}

      {view === "presets" && (
        <div className="view">
          <div className="preset-grid">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                selected={settings.selectedPreset === preset.id}
                active={status.activePresetId === preset.id}
                disabled={actionPending}
                onSelect={(id) => void persistSettings({ ...settings, selectedPreset: id })}
              />
            ))}
          </div>
        </div>
      )}

      {view === "logs" && (
        <div className="view">
          <LogConsole logs={logs} onClear={() => setLogs([])} />
        </div>
      )}

      {view === "settings" && (
        <div className="view">
          <SettingsPanel
            settings={settings}
            disabled={actionPending}
            onChange={(nextSettings) => void persistSettings(nextSettings)}
          />
        </div>
      )}
    </div>
  );
}
