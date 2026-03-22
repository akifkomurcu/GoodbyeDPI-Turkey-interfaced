# GoodbyeDPI Turkey Interface

Windows icin Tauri tabanli bir GoodbyeDPI Turkey masaustu kontrol paneli.

## Neler Var

- Preset odakli baslat/durdur akisi
- Canli stdout/stderr loglari
- Temel ayarlarin JSON olarak saklanmasi
- Paketlenmis resource klasorunden GoodbyeDPI calistirma
- Upstream repo ile ayri tutulan entegrasyon yapisi

## Proje Yapisi

- `upstream/GoodbyeDPI-Turkey`: referans kaynak repo
- `resources/goodbyedpi`: paketlenecek README, lisans ve Windows binary dosyalari
- `src`: React arayuzu
- `src-tauri`: Tauri/Rust backend'i
- `scripts/sync-upstream.mjs`: kaynaklari resource klasorune tasiyan yardimci script

## Gelistirme Notlari

1. Bu makinede `rust` ve `cargo` kurulu olmali.
2. Windows icin `resources/goodbyedpi/bin` altina `goodbyedpi.exe`, `WinDivert.dll` ve `WinDivert64.sys` dosyalarini yerlestirin.
3. Ardindan:

```bash
npm install
npm run sync:upstream
npm run tauri dev
```

## Durum

Upstream kaynak repo clone edildi:

- `upstream/GoodbyeDPI-Turkey`

Bu repo su an kaynak kod iceriyor; release binary'leri otomatik olarak getirmiyor.
