import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  AppSettings,
  LogEntry,
  LogStreamDescriptor,
  Preset,
  RuntimeStatus
} from "../types";

const LOG_EVENT = "goodbyedpi://log";
const STATUS_EVENT = "goodbyedpi://status";

export async function listPresets() {
  return invoke<Preset[]>("list_presets");
}

export async function getStatus() {
  return invoke<RuntimeStatus>("get_status");
}

export async function loadSettings() {
  return invoke<AppSettings>("load_settings");
}

export async function saveSettings(settings: AppSettings) {
  return invoke<AppSettings>("save_settings", { settings });
}

export async function startGoodbyeDpi(presetId: string) {
  return invoke<RuntimeStatus>("start_goodbyedpi", { presetId });
}

export async function stopGoodbyeDpi() {
  return invoke<RuntimeStatus>("stop_goodbyedpi");
}

export async function streamLogs() {
  return invoke<LogStreamDescriptor>("stream_logs");
}

export async function onLog(handler: (entry: LogEntry) => void): Promise<UnlistenFn> {
  return listen<LogEntry>(LOG_EVENT, (event) => handler(event.payload));
}

export async function onStatus(handler: (status: RuntimeStatus) => void): Promise<UnlistenFn> {
  return listen<RuntimeStatus>(STATUS_EVENT, (event) => handler(event.payload));
}

export const DEFAULT_STREAM_DESCRIPTOR: LogStreamDescriptor = {
  logEvent: LOG_EVENT,
  statusEvent: STATUS_EVENT
};

