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
          setLogs((current) => [...current.slice(-149), entry]);
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
    }, 2000);

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

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === settings.selectedPreset) ?? presets[0],
    [presets, settings.selectedPreset]
  );

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === status.activePresetId) ?? null,
    [presets, status.activePresetId]
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
      {
        timestamp: String(Date.now()),
        stream: "system",
        message
      }
    ]);
  }

  async function startPreset(presetId: string) {
    const nextStatus = await startGoodbyeDpi(presetId);
    setStatus(nextStatus);
  }

  async function handleStart(presetId = selectedPreset?.id) {
    if (!presetId) {
      return;
    }

    setActionPending(true);
    try {
      await startPreset(presetId);
      if (settings.selectedPreset !== presetId) {
        await persistSettings({ ...settings, selectedPreset: presetId });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus((current) => ({ ...current, state: "error", lastError: message }));
      pushSystemLog(`Baslatma hatasi: ${message}`);
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
      pushSystemLog(`Durdurma hatasi: ${message}`);
    } finally {
      setActionPending(false);
    }
  }

  async function handleTryPreset(presetId: string) {
    setActionPending(true);
    try {
      const nextSettings = { ...settings, selectedPreset: presetId };
      setSettings(nextSettings);
      await saveSettings(nextSettings);

      if (status.state === "running") {
        await stopGoodbyeDpi();
      }

      await startPreset(presetId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus((current) => ({ ...current, state: "error", lastError: message }));
      pushSystemLog(`Preset degistirme hatasi: ${message}`);
    } finally {
      setActionPending(false);
    }
  }

  const canStart = !busy && !actionPending && status.state !== "running" && !!selectedPreset;
  const canStop = !busy && !actionPending && status.state === "running";
  const statusSummary =
    status.state === "running"
      ? "Surec acik. Discord veya engelli bir site ile etkisini test edin."
      : status.state === "error"
        ? "Baslatma basarisiz oldu veya surec kapandi."
        : "Hazir. Bir preset secip baslatabilirsiniz.";

  return (
    <main className="shell shell--minimal">
      <section className="topbar">
        <div className="topbar__title">
          <p className="eyebrow">GoodbyeDPI Turkey</p>
          <h1>Kontrol Paneli</h1>
          <p className="topbar__summary">{statusSummary}</p>
        </div>
        <div className="topbar__meta">
          <StatusPill state={status.state} />
          <p>{activePreset?.label ?? selectedPreset?.label ?? "Preset secilmedi"}</p>
        </div>
      </section>

      {settings.requireAdmin ? (
        <section className="notice notice--warning">
          Uygulamayi yonetici olarak acmaniz gerekir. GoodbyeDPI sureci gizli baslatilir ama hala
          yonetici yetkisi ister.
        </section>
      ) : null}

      {status.lastError ? (
        <section className="notice notice--error">{status.lastError}</section>
      ) : null}

      <section className="dashboard-grid">
        <section className="panel status-panel">
          <div className="panel__header">
            <div>
              <h2>Durum</h2>
              <p>Anlik surec ozeti.</p>
            </div>
          </div>

          <div className="status-metrics">
            <div>
              <span>Secili</span>
              <strong>{selectedPreset?.label ?? "-"}</strong>
            </div>
            <div>
              <span>Aktif</span>
              <strong>{activePreset?.label ?? "-"}</strong>
            </div>
            <div>
              <span>PID</span>
              <strong>{status.pid ?? "-"}</strong>
            </div>
          </div>

          <div className="actions actions--compact">
            <button type="button" className="primary-button" onClick={() => void handleStart()} disabled={!canStart}>
              {actionPending ? "Isleniyor..." : "Baslat"}
            </button>
            <button type="button" className="secondary-button" onClick={() => void handleStop()} disabled={!canStop}>
              Durdur
            </button>
          </div>

          <p className="status-note">
            {status.state === "running"
              ? "Siyah konsol penceresi gizlendi. Surec arka planda calisiyor."
              : "Arayuz sadece surecin acik olup olmadigini bilir; internet etkisini elle test edin."}
          </p>
        </section>

        <SettingsPanel
          settings={settings}
          disabled={actionPending}
          onChange={(nextSettings) => {
            void persistSettings(nextSettings);
          }}
        />
      </section>

      <section className="panel preset-panel">
        <div className="panel__header">
          <div>
            <h2>Preset'ler</h2>
            <p>Sec veya dogrudan dene. Calisiyorsa otomatik olarak degistirilir.</p>
          </div>
        </div>
        <div className="preset-grid preset-grid--minimal">
          {presets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              selected={settings.selectedPreset === preset.id}
              running={status.state === "running"}
              active={status.activePresetId === preset.id}
              disabled={actionPending}
              onSelect={(presetId) => {
                void persistSettings({ ...settings, selectedPreset: presetId });
              }}
              onTry={(presetId) => {
                void handleTryPreset(presetId);
              }}
            />
          ))}
        </div>
      </section>

      <LogConsole logs={logs} onClear={() => setLogs([])} />
    </main>
  );
}
