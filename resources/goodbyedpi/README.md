# GoodbyeDPI Resource Folder

Bu klasor, Tauri paketine alinacak GoodbyeDPI dosyalarini tutar.

Gerekli Windows dosyalari:

- `bin/goodbyedpi.exe`
- `bin/WinDivert.dll`
- `bin/WinDivert64.sys`

Kaynak kodu bu repoda `upstream/GoodbyeDPI-Turkey` altinda tutulur. Release binary'leri upstream kaynak reposunda bulunmadigi icin Windows release dosyalarini bu klasore ayri olarak yerlestirmeniz gerekir.

Yardimci dokumanlar:

- `LICENSE`
- `UPSTREAM-README.md`
- `UPSTREAM-REVERT.md`
- `manifest.json`

Hazir oldugunda:

```bash
npm run sync:upstream
```

Bu komut, varsa lisans ve upstream dokumanlarini kopyalar; binary dosyalar eksikse `manifest.json` uzerinden bunu raporlar.

## GoodbyeDPI'ı Kullanmak

GoodbyeDPI'ın Türkiye fork'unu kullanmak için iki yöntem bulunmaktadır.

- Hizmet kurarak kullanma: Yalnızca bir kez hizmeti kurup ardından elle herhangi bir şey çalıştırmaya gerek kalmaksızın bilgisayarınız her yeniden başlatıldığında otomatik olarak çalışır.
- Batch dosyası ile kullanma: batch dosyası ile kullanmada her defasında elle batch dosyasını başlatarak kullanmanız gerekir (batch penceresi kapatıldığında GoodbyeDPI kullanımına son verilir).

> [!NOTE]
> İndirdiğiniz ZIP dosyasını çıkarttığınız konumdan taşımayın. Kurulacak hizmet .cmd dosyasını çalıştırdığınız dosya yolunu kullanacağından eğer dosyaları taşırsanız hizmet çalışmayacaktır. (Tavsiyem sizi rahatsız etmeyecek bir konuma ZIP dosyasını çıkarmanız ve dosyaları orada saklamanız. Örneğin, ``C:\GoodbyeDPI\``.)

## Hizmet Kurarak Kullanma (Windows başlatılırken otomatik olarak çalıştırılır)

GoodbyeDPI Türkiye versiyonunu hizmet kurarak kullanmak için:

- [goodbyedpi-0.2.3rc3-turkey.zip](https://github.com/cagritaskn/GoodbyeDPI-Turkey/releases/download/release-0.2.3rc3-turkey/goodbyedpi-0.2.3rc3-turkey.zip) dosyasını bilgisayarınıza indirin.
- ZIP dosyasını herhangi bir dizine çıkarın.
- Çıkartılan dosyalardan ``service_install_dnsredir_turkey.cmd`` dosyasına sağ tıklayarak ``Yönetici Olarak Çalıştır`` seçeneğini seçin.
- Açılan konsol penceresinde herhangi bir tuşuna basın.
- Pencere, hizmet kurulduğunda otomatik olarak kapanacak ve hizmet de otomatik olarak başlayacaktır.

> [!NOTE]
> Bu işlem bilgisayarınıza GoodbyeDPI hizmetini kuracaktır. GoodbyeDPI hizmetini bilgisayarınızdan kaldırmak için çıkarttığınız dosyalar içerisindeki ``service_remove.cmd`` dosyasını yönetici olarak çalıştırmanız gerekmektedir.

## Batch Dosyası İle Kullanma (Tek seferlik, pencere kapatıldığında sona erecek şekilde)

GoodbyeDPI Türkiye fork'unu batch dosyasını çalıştırarak kullanmak için **(Bir komut penceresi açılır ve uygulama çalışmaya başlar, bu pencere kapatıldığında çalışmaya son verilir)** :

- [goodbyedpi-0.2.3rc3-turkey.zip](https://github.com/cagritaskn/GoodbyeDPI-Turkey/releases/download/release-0.2.3rc3-turkey/goodbyedpi-0.2.3rc3-turkey.zip) dosyasını bilgisayarınıza indirin.
- ZIP dosyasını herhangi bir dizine çıkarın.
- Çıkartılan dosyalardan ``turkey_dnsredir.cmd`` dosyasına sağ tıklayarak ``Yönetici Olarak Çalıştır`` seçeneğini seçin.

> [!NOTE]
> ``turkey_dnsredir.cmd`` dosyasını yönetici olarak çalıştırdığınızda GoodbyeDPI aktif olacaktır. Ancak bu yöntemle çalıştırıldığında hem bilgisayarınız yeniden başlatıldığında GoodbyeDPI'ı elle açmanız gerekecek, hem de ``turkey_dnsredir.cmd`` ile açılan pencere kapatıldığında GoodbyeDPI deaktive olacaktır.

## GoodbyeDPI'ı Kaldırmak ve DNS Ayarlarını Eski Haline Getirmek

GoodbyeDPI'ı tamamen kapatmak ve silmek, bununla birlikte DNS atamasını kaldırmak için **[bu rehberi](https://github.com/cagritaskn/GoodbyeDPI-Turkey/blob/master/REVERT.md)** takip edebilirsiniz.

## Sık Karşılaşılan Sorunlar

- WinDivert dosyaları bulunamadı hatası (Yalancı virüs algılaması):
WinDivert dosyaları bulunamadı hatası alıyorsanız antivirüs programınıza ayıkladığınız klasörü dışlama/istisna olarak ekleyin. Windows Defender kullanıyorsanız [buradaki rehberi](https://support.microsoft.com/tr-tr/windows/windows-g%C3%BCvenli%C4%9Fi-ne-d%C4%B1%C5%9Flama-ekleme-811816c0-4dfd-af4a-47e4-c301afe13b26) (Kaspersky antivirüs programı için [buradaki rehberi](https://support.kaspersky.com/ksos/8.5/tr-TR/227390.htm)) takip ederek "goodbyedpi-0.2.3rc3-turkey" klasörünü dışlamalara ekleyebilirsiniz. Ancak dışlamalara eklemek sorununuzu çözmeyebilir. Bu durumda Kaspersky isimli programı sisteminizden tamamen kaldırıp ardından GoodbyeDPI-Turkey'in kurulumunu tekrar gerçekleştirmeniz gerekebilir.

- Hizmetin başlatmaya çalışıldığında "Dosya yolu bulunamadı" hatası:
Bu hata indirdiğiniz .zip klasörünü çıkardığınız konumdan farklı bir konuma taşımanız halinde ya da bazı dosyaları silmeniz halinde ortaya çıkar. Bu durumda [goodbyedpi-0.2.3rc3-turkey.zip](https://github.com/cagritaskn/GoodbyeDPI-Turkey/releases/download/release-0.2.3rc3-turkey/goodbyedpi-0.2.3rc3-turkey.zip) dosyasını tekrar bilgisayarınızda bir konuma çıkararak öncelikle service_remove.cmd dosyasını yönetici olarak çalıştırdıktan sonra seçeceğiniz diğer .cmd dosyasını tekrar çalıştırarak bu sorunu çözebilirsiniz.

- Bazı sitelerin yavaş açılması/açılmaması sorunu:
Bu sorunu komut dosyalarında TTL ayarı bulunan yöntemlerde yaşayabilirsiniz. Eğer belirli siteler yavaş açılıyor ya da hiç açılmıyorsa TTL ayarı içermeyen 2 ve 4 numaralı alternatif metodları kullanarak bu sorunu çözebilirsiniz. Eğer hali hazırda başka bir komut dosyası ile kurulum yaptıysanız öncelikle ``service_remove.cmd`` komut dosyasını yönetici olarak çalıştırıp ardından 2 veya 4 numaralı alternatif yöntemleri ``service_install_dnsredir_turkey_alternative2_superonline`` ya da ``service_install_dnsredir_turkey_alternative4_superonline`` isimli komut dosyalarını yönetici olarak çalıştırıp talimatları takip ederek kurmalısınız.

- Discord'a web üzerinden giriş yapabilmeye rağmen uygulamanın açılmaması sorunu:
Bu sorun genellikle fiber tarife kullanıcılarının karşılaştığı bir sorun ve maalesef kesin bir çözüm yolu yok. Ancak yine de bu çözüm yolunu deneyebilirsiniz: **[WinDivertTool.exe](https://github.com/basil00/WinDivertTool/releases/download/v2.2.0/WinDivertTool.exe)** isimli WinDivert tanı aracını indirip çalıştırdıktan sonra konsol penceresinin en altında yer alan listede hangi uygulamaların WinDivert kullanarak çalıştığını görebilirsiniz. Bu listede birden fazla uygulama var ise ilgili satırlarda bulunan konuma giderek söz konusu uygulamayı veya uygulamaları siliniz. Yalnızca en son kurduğunuz konumdaki WinDivert kütüphanesini kullanan uygulamayı silmeyiniz. Ardından bilgisayarınızı yeniden başlatarak doğru şekilde çalışıp çalışmadığını deneyebilirsiniz. 

- Ethernet bağlantısı sorunu: 
İnternet bağlantınızı ethernet adaptörü aracılığı ile sağlıyorsanız ve GoodbyeDPI tüm çözümleri denemenize rağmen GoodbyeDPI'ı çalıştaramadıysanız **harmanprecious** isimli kullanıcıya ait çözüm rehberine **[bu adresten](https://www.technopat.net/sosyal/konu/goodbyedpi-ethernet-kartiyla-calismiyorsa-ne-yapilmali.3619948/)** adresinden ulaşabilirsiniz.

## DNS ve Port'u Düzenleme

Bu forktaki komut dosyalarında varsayılan olarak **Yandex DNS** kullanılmaktadır. Farklı bir DNS kullanmak için ``turkey_dnsredir.cmd`` ve ``service_install_dnsredir_turkey.cmd`` dosyalarını herhangi bir metin düzenleyici ile düzenleyerek DNS ve port bilgilerini değiştirebilirsiniz. Eğer alternatif metod 1, 2 veya 6'yı kullanacaksanız, **Windows 10 için [buradan](https://www.ipsorgu.com/windows_10_dns_degistirme.php)**, **Windows 11 için [buradan](https://www.ipsorgu.com/windows_11_dns_degistirme.php)** bakarak Windows ayarlarında DNS'inizi tercih ettiğiniz bir DNS adresine çevirin (Tavsiye edilen: Yandex DNS - 77.88.8.8/77.88.8.1 , Cloudflare DNS - 1.1.1.1/1.0.0.1). Eğer alternatif metod 3, 4 veya 5'i kullanacaksanız ayrıca DNS ayarlamanıza gerek yok, çünkü alternatif metod 3, 4 ve 5'te önayarlı olarak Yandex DNS kullanılmaktayken; 1, 2 ve 6 numaralı alternatif metodlarda önayarlı DNS bulunmamaktadır.

## WinDivert.dll ve WinDivert64.sys Dosyalarını Silmek​

Eğer bu dosyaları silmeye çalıştığınızda dosya kullanımda hatası alırsanız, indirdiğiniz dosyalardaki ``service_remove.cmd`` dosyasını yönetici olarak çalıştırdıktan sonra silebilirsiniz.
> [!NOTE]
> WinDivert dosyaları da açık kaynak kodludur. Buradan WinDivert kütüphanesinin açık kaynak kodlarına ulaşabilirsiniz: **[WinDivert 2.2: Windows Packet Divert](https://github.com/basil00/WinDivert)**

## SuperOnline Alternatif Yöntemler

Eğer SuperOnline Fiber kullanıyorsanız ve "Discord update failed - retrying in ** seconds" hatası alıyorsanız:

### 1- Alternatif CMD Dosyaları
>
> [!NOTE]
> Daha önceden diğer bir servisi kurduysanız ``service_remove.cmd`` dosyası ile kurulmuş olan servisi kaldırıp ardından alternatif aşağıdaki işlemleri yapın.

- Yukarıda anlatılan işlemleri ``turkey_dnsredir_alternative(1/2/3/4/5/6)_superonline.cmd``
komut dosyalarından biri ile veya  ``service_install_dnsredir_turkey_alternative(1/2/3/4/5/6)_superonline.cmd`` komut dosyaları ile yapmayı deneyin (Sağ tık > Yönetici Olarak Çalıştır, daha sonra pencere açıldığında herhangi bir tuşa basın).
- Bu işlemleri tamamladıktan sonra **Windows 10 için [buradan](https://www.ipsorgu.com/windows_10_dns_degistirme.php)**, **Windows 11 için [buradan](https://www.ipsorgu.com/windows_11_dns_degistirme.php)** bakarak Windows ayarlarında DNS'inizi tercih ettiğiniz bir DNS adresine çevirin. (Tavsiye edilen: Yandex DNS - 77.88.8.8/77.88.8.1 , Cloudflare DNS - 1.1.1.1/1.0.0.1)
- Ardından bilgisayarınızı yeniden başlatın.

Bu şekilde de Discord update failed - retrying in ** seconds hatası alıyorsanız:

### 2- VPN ile Kaba Kuvvet

Yukarıda anlatılan işlemleri yaptıktan (Hizmeti kurduktan veya cmd dosyasını çalışır hale getirdikten) sonra, herhangi bir Windows VPN'i açıp discordu başlatın ve discordun açılmasını bekleyin. Discord açıldıktan sonra VPN'i kapatın ve Discordu kullanmaya devam edin.

Bunlara rağmen Superonline ile Discorda giriş yapamıyorsanız

### 3- GoodbyeDPI ile Benzer Programlar

SecureDNSClient veya Zapret isimli programları da deneyebilirsiniz. (Ben denemedim ve rehberlerini de bulamadım ufak bir araştırma ile bulabilirsiniz.)


## Bağış ve Destek

Bu programı kullanmak tamamen ücretsizdir. Kullanımından herhangi bir gelir elde etmiyorum. Ancak çalışmalarıma devam edebilmem için aşağıda bulunan bağış adreslerinden beni destekleyebilirsiniz.

**GitHub Sponsor:**

[![Sponsor](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/cagritaskn)

**Patreon:**

[![Static Badge](https://img.shields.io/badge/cagritaskn-purple?logo=patreon&label=Patreon)](https://www.patreon.com/cagritaskn/membership)

## Yasal Uyarı
>
> [!IMPORTANT]
> Bu uygulamanın kullanımından doğan her türlü yasal sorumluluk kullanan kişiye aittir. Uygulama yalnızca eğitim ve araştırma amaçları ile yazılmış ve düzenlenmiş olup; bu uygulamayı bu şartlar altında kullanmak ya da kullanmamak kullanıcının kendi seçimidir. Açık kaynak kodlarının paylaşıldığı bu platformdaki düzenlenmiş bu proje, bilgi paylaşımı ve kodlama eğitimi amaçları ile yazılmış ve düzenlenmiştir.
