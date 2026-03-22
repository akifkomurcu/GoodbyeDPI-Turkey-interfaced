import type { Preset } from "../types";

interface PresetCardProps {
  preset: Preset;
  selected: boolean;
  running: boolean;
  active: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onTry: (id: string) => void;
}

export function PresetCard({
  preset,
  selected,
  running,
  active,
  disabled,
  onSelect,
  onTry
}: PresetCardProps) {
  return (
    <article className={`preset-card ${selected ? "preset-card--selected" : ""}`}>
      <div className="preset-card__top">
        <div>
          <strong>{preset.label}</strong>
          <span>{active ? "Çalışıyor" : selected ? "Seçili" : "Hazır"}</span>
        </div>
        <div className="preset-card__badges">
          {active ? <em>Aktif</em> : null}
          {selected && !active ? <i>Seçili</i> : null}
        </div>
      </div>
      <p className="preset-card__description">{preset.description}</p>
      <code title={preset.args.join(" ") || preset.scriptRef || "Varsayılan"}>
        {preset.args.join(" ") || preset.scriptRef || "Varsayılan"}
      </code>
      <div className="preset-card__actions">
        <button
          type="button"
          className="ghost-button"
          onClick={() => onSelect(preset.id)}
          disabled={disabled}
        >
          {selected ? "Seçili" : "Seç"}
        </button>
        <button
          type="button"
          className="primary-button primary-button--small"
          onClick={() => onTry(preset.id)}
          disabled={disabled}
        >
          {running && !active ? "Geç ve Dene" : "Hemen Dene"}
        </button>
      </div>
    </article>
  );
}

