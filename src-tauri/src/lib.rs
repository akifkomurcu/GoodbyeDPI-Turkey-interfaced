use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager, State};

const LOG_EVENT: &str = "goodbyedpi://log";
const STATUS_EVENT: &str = "goodbyedpi://status";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Preset {
    id: String,
    label: String,
    description: String,
    launch_mode: String,
    args: Vec<String>,
    script_ref: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AppSettings {
    selected_preset: String,
    run_on_launch: bool,
    remember_last_preset: bool,
    language: String,
    auto_retry: bool,
    require_admin: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            selected_preset: "turkiye-guvenli".into(),
            run_on_launch: false,
            remember_last_preset: true,
            language: "tr".into(),
            auto_retry: false,
            require_admin: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RuntimeStatus {
    state: String,
    active_preset_id: Option<String>,
    pid: Option<u32>,
    last_error: Option<String>,
    resource_path: Option<String>,
}

impl RuntimeStatus {
    fn stopped(resource_path: Option<String>) -> Self {
        Self {
            state: "stopped".into(),
            active_preset_id: None,
            pid: None,
            last_error: None,
            resource_path,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LogEntry {
    timestamp: String,
    stream: String,
    message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct LogStreamDescriptor {
    log_event: String,
    status_event: String,
}

struct ManagedProcess {
    child: Child,
    active_preset_id: String,
    resource_path: String,
}

struct AppRuntime {
    process: Mutex<Option<ManagedProcess>>,
    status: Mutex<RuntimeStatus>,
}

impl AppRuntime {
    fn new() -> Self {
        Self {
            process: Mutex::new(None),
            status: Mutex::new(RuntimeStatus::stopped(None)),
        }
    }
}

fn preset_catalog() -> Vec<Preset> {
    vec![
        Preset {
            id: "turkiye-guvenli".into(),
            label: "Turkiye Guvenli".into(),
            description: "Varsayilan ve en uyumlu profil. Cogu baglantida once bununla baslayin.".into(),
            launch_mode: "cli-args".into(),
            args: vec!["-1".into()],
            script_ref: None,
        },
        Preset {
            id: "turkiye-dengeli".into(),
            label: "Turkiye Dengeli".into(),
            description: "HTTPS agirlikli kullanim icin daha hizli ama hala guvenli secenek.".into(),
            launch_mode: "cli-args".into(),
            args: vec!["-2".into()],
            script_ref: None,
        },
        Preset {
            id: "turkiye-hizli".into(),
            label: "Turkiye Hizli".into(),
            description: "En iyi performansi hedefler; bazi aglarda daha az uyumlu olabilir.".into(),
            launch_mode: "cli-args".into(),
            args: vec!["-4".into()],
            script_ref: None,
        },
        Preset {
            id: "turkiye-dnsredir".into(),
            label: "DNS Redirection".into(),
            description: "Yandex DNS ile DNS yonlendirmesini de etkinlestirir. DNS kaynakli engellerde deneyin.".into(),
            launch_mode: "cli-args".into(),
            args: vec![
                "-9".into(),
                "--dns-addr".into(),
                "77.88.8.8".into(),
                "--dns-port".into(),
                "53".into(),
            ],
            script_ref: None,
        },
    ]
}

fn emit_log(app: &AppHandle, stream: &str, message: impl Into<String>) {
    let entry = LogEntry {
        timestamp: timestamp_millis(),
        stream: stream.into(),
        message: message.into(),
    };
    let _ = app.emit(LOG_EVENT, entry);
}

fn timestamp_millis() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    now.as_millis().to_string()
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let config_dir = app
        .path()
        .app_config_dir()
        .map_err(|error| format!("Ayar klasoru bulunamadi: {error}"))?;
    fs::create_dir_all(&config_dir)
        .map_err(|error| format!("Ayar klasoru olusturulamadi: {error}"))?;
    Ok(config_dir.join("settings.json"))
}

fn load_settings_from_disk(app: &AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(app)?;
    if !path.exists() {
        let defaults = AppSettings::default();
        save_settings_to_disk(app, &defaults)?;
        return Ok(defaults);
    }

    let content = fs::read_to_string(&path)
        .map_err(|error| format!("Ayar dosyasi okunamadi: {error}"))?;
    serde_json::from_str(&content).map_err(|error| format!("Ayar dosyasi gecersiz: {error}"))
}

fn save_settings_to_disk(app: &AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = settings_path(app)?;
    let payload = serde_json::to_string_pretty(settings)
        .map_err(|error| format!("Ayarlar serilestirilemedi: {error}"))?;
    fs::write(path, payload).map_err(|error| format!("Ayar dosyasi yazilamadi: {error}"))
}

fn resolve_resource_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(resolved) = app.path().resolve("goodbyedpi", BaseDirectory::Resource) {
        if resolved.exists() {
            return Ok(resolved);
        }
    }

    let dev_path = Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .ok_or_else(|| "Proje kok klasoru bulunamadi.".to_string())?
        .join("resources")
        .join("goodbyedpi");
    if dev_path.exists() {
        return Ok(dev_path);
    }

    Err("GoodbyeDPI resource klasoru bulunamadi.".into())
}

fn ensure_binary_layout(resource_dir: &Path) -> Result<PathBuf, String> {
    let binary_dir = resource_dir.join("bin");
    let required_files = [
        "goodbyedpi.exe",
        "WinDivert.dll",
        "WinDivert64.sys",
    ];

    let missing: Vec<String> = required_files
        .iter()
        .filter(|name| !binary_dir.join(name).exists())
        .map(|name| (*name).to_string())
        .collect();

    if !missing.is_empty() {
        return Err(format!(
            "Paketlenmis GoodbyeDPI dosyalari eksik: {}. `npm run sync:upstream` ve release dosyalariyla `resources/goodbyedpi/bin` klasorunu doldurun.",
            missing.join(", ")
        ));
    }

    Ok(binary_dir)
}

fn current_status(runtime: &AppRuntime) -> RuntimeStatus {
    runtime
        .status
        .lock()
        .expect("runtime status lock poisoned")
        .clone()
}

fn set_status(runtime: &AppRuntime, app: &AppHandle, status: RuntimeStatus) -> RuntimeStatus {
    {
        let mut guard = runtime.status.lock().expect("runtime status lock poisoned");
        *guard = status.clone();
    }
    let _ = app.emit(STATUS_EVENT, status.clone());
    status
}

fn refresh_process_state(runtime: &AppRuntime, app: &AppHandle) -> RuntimeStatus {
    let mut process_guard = runtime.process.lock().expect("runtime process lock poisoned");
    let observed_exit = if let Some(process) = process_guard.as_mut() {
        match process.child.try_wait() {
            Ok(Some(exit_status)) => Some(Ok((
                exit_status.success(),
                process.active_preset_id.clone(),
                process.resource_path.clone(),
                exit_status.to_string(),
            ))),
            Ok(None) => None,
            Err(error) => Some(Err((process.resource_path.clone(), error.to_string()))),
        }
    } else {
        None
    };

    if let Some(result) = observed_exit {
        *process_guard = None;
        drop(process_guard);

        return match result {
            Ok((success, preset_id, resource_path, exit_status)) => set_status(
                runtime,
                app,
                RuntimeStatus {
                    state: if success { "stopped".into() } else { "error".into() },
                    active_preset_id: if success { None } else { Some(preset_id) },
                    pid: None,
                    last_error: if success {
                        None
                    } else {
                        Some(format!("Surec beklenmedik sekilde sonlandi: {exit_status}"))
                    },
                    resource_path: Some(resource_path),
                },
            ),
            Err((resource_path, error)) => set_status(
                runtime,
                app,
                RuntimeStatus {
                    state: "error".into(),
                    active_preset_id: None,
                    pid: None,
                    last_error: Some(format!("Surec durumu okunamadi: {error}")),
                    resource_path: Some(resource_path),
                },
            ),
        };
    }
    drop(process_guard);
    current_status(runtime)
}

fn spawn_log_reader<R>(reader: R, stream: &'static str, app: AppHandle)
where
    R: std::io::Read + Send + 'static,
{
    std::thread::spawn(move || {
        let lines = BufReader::new(reader).lines();
        for line in lines {
            match line {
                Ok(message) => emit_log(&app, stream, message),
                Err(error) => {
                    emit_log(&app, "system", format!("Log okunamadi: {error}"));
                    break;
                }
            }
        }
    });
}

#[tauri::command]
fn list_presets() -> Vec<Preset> {
    preset_catalog()
}

#[tauri::command]
fn get_status(app: AppHandle, runtime: State<'_, AppRuntime>) -> Result<RuntimeStatus, String> {
    Ok(refresh_process_state(&runtime, &app))
}

#[tauri::command]
fn load_settings(app: AppHandle) -> Result<AppSettings, String> {
    load_settings_from_disk(&app)
}

#[tauri::command]
fn save_settings(app: AppHandle, settings: AppSettings) -> Result<AppSettings, String> {
    save_settings_to_disk(&app, &settings)?;
    Ok(settings)
}

#[tauri::command]
fn stream_logs() -> LogStreamDescriptor {
    LogStreamDescriptor {
        log_event: LOG_EVENT.into(),
        status_event: STATUS_EVENT.into(),
    }
}

#[tauri::command]
fn start_goodbyedpi(
    app: AppHandle,
    runtime: State<'_, AppRuntime>,
    preset_id: String,
) -> Result<RuntimeStatus, String> {
    let status = refresh_process_state(&runtime, &app);
    if status.state == "running" {
        return Err("Ayni anda yalnizca tek GoodbyeDPI sureci calisabilir.".into());
    }

    let settings = load_settings_from_disk(&app).unwrap_or_default();
    let preset = preset_catalog()
        .into_iter()
        .find(|preset| preset.id == preset_id)
        .ok_or_else(|| "Secilen preset bulunamadi.".to_string())?;

    let resource_dir = resolve_resource_dir(&app)?;
    let binary_dir = ensure_binary_layout(&resource_dir)?;
    let executable = binary_dir.join("goodbyedpi.exe");

    let mut command = Command::new(&executable);
    command
        .args(&preset.args)
        .current_dir(&binary_dir)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let mut child = command.spawn().map_err(|error| {
        format!(
            "GoodbyeDPI baslatilamadi: {error}. Yonetici izni ve WinDivert dosyalarini kontrol edin."
        )
    })?;

    if let Some(stdout) = child.stdout.take() {
        spawn_log_reader(stdout, "stdout", app.clone());
    }
    if let Some(stderr) = child.stderr.take() {
        spawn_log_reader(stderr, "stderr", app.clone());
    }

    let pid = child.id();
    let resource_path = resource_dir.display().to_string();

    {
        let mut process_guard = runtime.process.lock().expect("runtime process lock poisoned");
        *process_guard = Some(ManagedProcess {
            child,
            active_preset_id: preset.id.clone(),
            resource_path: resource_path.clone(),
        });
    }

    let next_status = RuntimeStatus {
        state: "running".into(),
        active_preset_id: Some(preset.id.clone()),
        pid: Some(pid),
        last_error: None,
        resource_path: Some(resource_path.clone()),
    };

    let updated_settings = AppSettings {
        selected_preset: if settings.remember_last_preset {
            preset.id.clone()
        } else {
            settings.selected_preset
        },
        ..settings
    };
    let _ = save_settings_to_disk(&app, &updated_settings);

    emit_log(
        &app,
        "system",
        format!("{} preset'i ile GoodbyeDPI baslatildi.", preset.label),
    );

    Ok(set_status(&runtime, &app, next_status))
}

#[tauri::command]
fn stop_goodbyedpi(app: AppHandle, runtime: State<'_, AppRuntime>) -> Result<RuntimeStatus, String> {
    let mut process_guard = runtime.process.lock().expect("runtime process lock poisoned");
    let Some(mut process) = process_guard.take() else {
        let status = RuntimeStatus::stopped(None);
        drop(process_guard);
        return Ok(set_status(&runtime, &app, status));
    };

    if let Err(error) = process.child.kill() {
        let status = RuntimeStatus {
            state: "error".into(),
            active_preset_id: None,
            pid: None,
            last_error: Some(format!("Surec durdurulamadi: {error}")),
            resource_path: Some(process.resource_path.clone()),
        };
        drop(process_guard);
        return Ok(set_status(&runtime, &app, status));
    }
    let _ = process.child.wait();
    drop(process_guard);

    emit_log(&app, "system", "GoodbyeDPI sureci durduruldu.");
    Ok(set_status(
        &runtime,
        &app,
        RuntimeStatus::stopped(Some(process.resource_path)),
    ))
}

pub fn run() {
    tauri::Builder::default()
        .manage(AppRuntime::new())
        .invoke_handler(tauri::generate_handler![
            list_presets,
            get_status,
            load_settings,
            save_settings,
            start_goodbyedpi,
            stop_goodbyedpi,
            stream_logs
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();
            let runtime = app.state::<AppRuntime>();
            let initial_status = match resolve_resource_dir(&app_handle) {
                Ok(resource_dir) => RuntimeStatus::stopped(Some(resource_dir.display().to_string())),
                Err(error) => RuntimeStatus {
                    state: "error".into(),
                    active_preset_id: None,
                    pid: None,
                    last_error: Some(error),
                    resource_path: None,
                },
            };
            set_status(&runtime, &app_handle, initial_status);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
