import type { Preset } from "../types";

interface PresetCardProps {
  preset: Preset;
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

export function PresetCard({ preset, selected, disabled, onSelect }: PresetCardProps) {
  return (
    <button
      type="button"
      className={`preset-card ${selected ? "preset-card--selected" : ""}`}
      onClick={() => onSelect(preset.id)}
      disabled={disabled}
    >
      <div className="preset-card__header">
        <strong>{preset.label}</strong>
        <span>{preset.launchMode === "cli-args" ? "Hazir Profil" : "Script"}</span>
      </div>
      <p>{preset.description}</p>
      <code>{preset.args.join(" ") || preset.scriptRef || "Varsayilan"}</code>
    </button>
  );
}

