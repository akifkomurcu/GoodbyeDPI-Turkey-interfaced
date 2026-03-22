import { useEffect, useMemo, useState } from "react";
import { LogConsole } from "./components/LogConsole";
import { PresetCard } from "./components/PresetCard";
import { SettingsPanel } from "./components/SettingsPanel";
import { StatusPill } from "./components/StatusPill";
import {
  DEFAULT_STREAM_DESCRIPTOR,
  getStatus,
  listPresets,
  loadSettings,
  onLog,
  onStatus,
  saveSettings,
  startGoodbyeDpi,
  stopGoodbyeDpi,
  streamLogs
} from "./lib/tauri";
import type { AppSettings, LogEntry, Preset, RuntimeStatus } from "./types";

const initialSettings: AppSettings = {
  selectedPreset: "turkiye-guvenli",
  runOnLaunch: false,
  rememberLastPreset: true,
  language: "tr",
  autoRetry: false,
  requireAdmin: true
};

const initialStatus: RuntimeStatus = {
  state: "stopped",
  activePresetId: null,
  pid: null,
  lastError: null,
  resourcePath: null
};

export function App() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [status, setStatus] = useState<RuntimeStatus>(initialStatus);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState(true);
  const [actionPending, setActionPending] = useState(false);

  useEffect(() => {
    let active = true;
    let logUnlisten: (() => void) | undefined;
    let statusUnlisten: (() => void) | undefined;

    async function bootstrap() {
      try {
        const [availablePresets, storedSettings, runtimeStatus, descriptor] = await Promise.all([
          listPresets(),
          loadSettings(),
          getStatus(),
          streamLogs().catch(() => DEFAULT_STREAM_DESCRIPTOR)
        ]);

        if (!active) {
          return;
        }

        setPresets(availablePresets);
        setSettings(storedSettings);
        setStatus(runtimeStatus);

        logUnlisten = await onLog((entry) => {
          setLogs((current) => [...current.slice(-299), entry]);
        });

        statusUnlisten = await onStatus((nextStatus) => {
          setStatus(nextStatus);
        });

        if (!descriptor.logEvent || !descriptor.statusEvent) {
          console.warn("Log stream descriptor missing event names.");
        }
      } catch (error) {
        setStatus({
          state: "error",
          activePresetId: null,
          pid: null,
          lastError: error instanceof Error ? error.message : String(error),
          resourcePath: null
        });
      } finally {
        if (active) {
          setBusy(false);
        }
      }
    }

    bootstrap();

    const intervalId = window.setInterval(() => {
      getStatus()
        .then((nextStatus) => {
          if (active) {
            setStatus(nextStatus);
          }
        })
        .catch(() => undefined);
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      if (logUnlisten) {
        logUnlisten();
      }
      if (statusUnlisten) {
        statusUnlisten();
      }
    };
  }, []);

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === settings.selectedPreset) ?? presets[0],
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

  async function handleStart() {
    if (!activePreset) {
      return;
    }

    setActionPending(true);
    try {
      const nextStatus = await startGoodbyeDpi(activePreset.id);
      setStatus(nextStatus);
      if (settings.selectedPreset !== activePreset.id) {
        await persistSettings({ ...settings, selectedPreset: activePreset.id });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus((current) => ({ ...current, state: "error", lastError: message }));
      setLogs((current) => [
        ...current,
        {
          timestamp: String(Date.now()),
          stream: "system",
          message: `Baslatma hatasi: ${message}`
        }
      ]);
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
    } finally {
      setActionPending(false);
    }
  }

  const canStart = !busy && !actionPending && status.state !== "running" && !!activePreset;
  const canStop = !busy && !actionPending && status.state === "running";

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero__copy">
          <p className="eyebrow">GoodbyeDPI Turkey Desktop MVP</p>
          <h1>Windows icin tek ekrandan baslat, izle ve yonet.</h1>
          <p className="hero__summary">
            Bu arayuz, paketlenmis GoodbyeDPI kaynaklarini kullanarak secili profili
            baslatir, loglari toplar ve tek aktif surec kuraliyla calisir.
          </p>
        </div>
        <div className="hero__status">
          <StatusPill state={status.state} />
          <dl>
            <div>
              <dt>Aktif preset</dt>
              <dd>{activePreset?.label ?? "Yukleniyor"}</dd>
            </div>
            <div>
              <dt>Surec kimligi</dt>
              <dd>{status.pid ?? "-"}</dd>
            </div>
            <div>
              <dt>Kaynak klasoru</dt>
              <dd>{status.resourcePath ?? "Henuz bulunmadi"}</dd>
            </div>
          </dl>
        </div>
      </section>

      {settings.requireAdmin ? (
        <section className="notice notice--warning">
          GoodbyeDPI-Turkey genellikle yonetici yetkisiyle calistirilmalidir. Yonetici
          izni yoksa baslatma hatasi alabilirsiniz.
        </section>
      ) : null}

      {status.lastError ? (
        <section className="notice notice--error">{status.lastError}</section>
      ) : null}

      <section className="actions">
        <button type="button" className="primary-button" onClick={handleStart} disabled={!canStart}>
          {actionPending ? "Isleniyor..." : "Baslat"}
        </button>
        <button type="button" className="secondary-button" onClick={handleStop} disabled={!canStop}>
          Durdur
        </button>
      </section>

      <section className="content-grid">
        <section className="panel preset-panel">
          <div className="panel__header">
            <div>
              <h2>Hazir Preset'ler</h2>
              <p>Turkiye odakli guvenli profiller arasindan secim yapin.</p>
            </div>
          </div>
          <div className="preset-grid">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                selected={settings.selectedPreset === preset.id}
                disabled={actionPending}
                onSelect={(presetId) => {
                  const nextSettings = { ...settings, selectedPreset: presetId };
                  void persistSettings(nextSettings);
                }}
              />
            ))}
          </div>
        </section>

        <SettingsPanel
          settings={settings}
          disabled={actionPending}
          onChange={(nextSettings) => {
            void persistSettings(nextSettings);
          }}
        />
      </section>

      <LogConsole logs={logs} onClear={() => setLogs([])} />
    </main>
  );
}
