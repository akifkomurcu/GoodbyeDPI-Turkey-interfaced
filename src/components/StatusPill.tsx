import type { RuntimeStatus } from "../types";

const statusMap: Record<RuntimeStatus["state"], string> = {
  running: "Surec Acik",
  stopped: "Hazir",
  error: "Hata"
};

export function StatusPill({ state }: { state: RuntimeStatus["state"] }) {
  return (
    <span className={`status-pill status-pill--${state}`}>
      <span className="status-pill__dot" />
      {statusMap[state]}
    </span>
  );
}

