export type LaunchMode = "cli-args" | "script";

export interface Preset {
  id: string;
  label: string;
  description: string;
  launchMode: LaunchMode;
  args: string[];
  scriptRef?: string | null;
}

export interface AppSettings {
  selectedPreset: string;
  runOnLaunch: boolean;
  rememberLastPreset: boolean;
  language: "tr";
  autoRetry: boolean;
  requireAdmin: boolean;
}

export interface RuntimeStatus {
  state: "running" | "stopped" | "error";
  activePresetId?: string | null;
  pid?: number | null;
  lastError?: string | null;
  resourcePath?: string | null;
}

export interface LogEntry {
  timestamp: string;
  stream: "stdout" | "stderr" | "system";
  message: string;
}

export interface LogStreamDescriptor {
  logEvent: string;
  statusEvent: string;
}

