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
          <p>Ilk surum sadece guvenli ve kolay geri alinabilir secenekleri acar.</p>
        </div>
      </div>
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
          <span>Uygulama tekrar acildiginda secili profili geri yukler.</span>
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
          <strong>Baslatma basarisiz olursa yeniden dene</strong>
          <span>Yalnizca ayni preset icin tek ek deneme yapilir.</span>
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
          <strong>Yonetici uyarisini goster</strong>
          <span>GoodbyeDPI yonetici izni olmadan dogru calismayabilir.</span>
        </div>
      </label>
      <label className="toggle toggle--disabled">
        <input type="checkbox" checked={settings.runOnLaunch} disabled />
        <div>
          <strong>Windows ile otomatik baslat</strong>
          <span>Bu ozellik MVP sonrasi surume birakildi.</span>
        </div>
      </label>
    </section>
  );
}

