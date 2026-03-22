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
          <p>Yalnızca gerekli kontroller açık tutuldu.</p>
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
          <strong>Windows açılışında başlat</strong>
          <span>Oturum açıldığında uygulamayı açıp seçili preseti otomatik başlatır.</span>
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
          <strong>Son preset'i hatırla</strong>
          <span>Uygulama açıldığında son kullandığın preset seçili gelsin.</span>
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
          <strong>Başlatma başarısız olursa tekrar dene</strong>
          <span>Tek seferlik ek deneme yapılır.</span>
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
          <strong>Yönetici hatırlatmasını göster</strong>
          <span>GoodbyeDPI için yönetici yetkisi gerektiğini hatırlatır.</span>
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
          <strong>Kapatınca arka planda çalış</strong>
          <span>Pencere kapanmak yerine sistem tepsisine gizlenir.</span>
        </div>
      </label>
    </section>
  );
}

