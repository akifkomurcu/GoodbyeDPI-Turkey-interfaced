# GoodbyeDPI Turkey Interface

Windows icin Tauri tabanli bir GoodbyeDPI Turkey masaustu kontrol paneli.

## Son Kullanici

GitHub `Releases` sayfasindan Windows kurulum dosyasini indirebilirsiniz:

- `GoodbyeDPI Turkey Interface_<surum>_x64-setup.exe`

Release aciklamasi icin:

- `RELEASE_NOTES.md`

## Neler Var

- Preset odakli baslat/durdur akisi
- Canli stdout/stderr loglari
- Temel ayarlarin JSON olarak saklanmasi
- Paketlenmis resource klasorunden GoodbyeDPI calistirma
- Upstream dokumanlarini resource klasorunde saklayan entegrasyon yapisi

## Proje Yapisi

- `resources/goodbyedpi`: paketlenecek README, lisans ve Windows binary dosyalari
- `src`: React arayuzu
- `src-tauri`: Tauri/Rust backend'i
- `scripts/sync-upstream.mjs`: kaynaklari resource klasorune tasiyan yardimci script

## Gelistirme Notlari

1. Bu makinede `rust` ve `cargo` kurulu olmali.
2. Windows icin `resources/goodbyedpi/bin` altina `goodbyedpi.exe`, `WinDivert.dll` ve `WinDivert64.sys` dosyalarini yerlestirin.
3. Upstream dokumanlarini yenilemek isterseniz istege bagli olarak `upstream/GoodbyeDPI-Turkey` altina kaynak repoyu clone edin.
4. Ardindan:

```bash
npm install
npm run sync:upstream
npm run tauri dev
```

## Release Hazirlama

GitHub release varliklarini otomatik yuklemek icin workflow hazir:

- `.github/workflows/release.yml`

Bu workflow:

1. Windows uzerinde projeyi build eder
2. NSIS kurulum `.exe` dosyasini uretir
3. GitHub Release'e otomatik asset olarak yukler

## Durum

Release binary'leri bu repoda `resources/goodbyedpi/bin` altinda tutulur. `upstream/` klasoru zorunlu degildir; yalnizca bakim amacli yerel referans olarak kullanilabilir.
