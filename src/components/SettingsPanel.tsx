import type { AppSettings } from "../types";

interface SettingsPanelProps {
  settings: AppSettings;
  disabled?: boolean;
  onChange: (settings: AppSettings) => void;
}

export function SettingsPanel({ settings, disabled, onChange }: SettingsPanelProps) {
  return (
    <section className="panel settings-panel">
      <div className="panel__header">
        <div>
          <h2>Temel Ayarlar</h2>
          <p>Yalnizca gerekli kontroller acik tutuldu.</p>
        </div>
      </div>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.runOnLaunch}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...settings, runOnLaunch: event.target.checked })
          }
        />
        <div>
          <strong>Windows acilisinda baslat</strong>
          <span>Oturum acildiginda uygulamayi acip secili preseti otomatik baslatir.</span>
        </div>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.rememberLastPreset}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...settings, rememberLastPreset: event.target.checked })
          }
        />
        <div>
          <strong>Son preset'i hatirla</strong>
          <span>Uygulama acildiginda son kullandigin preset secili gelsin.</span>
        </div>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.autoRetry}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...settings, autoRetry: event.target.checked })
          }
        />
        <div>
          <strong>Baslatma basarisiz olursa tekrar dene</strong>
          <span>Tek seferlik ek deneme yapilir.</span>
        </div>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.requireAdmin}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...settings, requireAdmin: event.target.checked })
          }
        />
        <div>
          <strong>Yonetici hatirlatmasini goster</strong>
          <span>GoodbyeDPI icin yonetici yetkisi gerektigini hatirlatir.</span>
        </div>
      </label>
      <label className="toggle">
        <input
          type="checkbox"
          checked={settings.minimizeToTray}
          disabled={disabled}
          onChange={(event) =>
            onChange({ ...settings, minimizeToTray: event.target.checked })
          }
        />
        <div>
          <strong>Kapatinca arka planda calis</strong>
          <span>Pencere kapanmak yerine sistem tepsisine gizlenir.</span>
        </div>
      </label>
    </section>
  );
}

