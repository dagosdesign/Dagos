# Lexistencehub – mobil uygulama ve mağaza yol haritası (Faz 2–5)

Bu dosya, web uygulamasının iOS / Android paketine dönüşmesi ve mağazalara gönderilmesi
için gereken her şeyi tek yerde toplar. Kod tarafı hazır (Capacitor); geri kalanı hesaplar,
derleme ortamı ve mağaza formlarıdır.

## Kod tarafında hazır olanlar
- `capacitor.config.ts`, `android/`, `ios/` projeleri – appId **app.lexistencehub**
  (mağazaya ilk yüklemeden sonra değişmez; değiştirmek istersen şimdi söyle).
- `npm run build:native` → web kısmını `.env.native` ile derler (API ve fotoğraflar
  `https://lex-zmt3.onrender.com` adresinden gelir) ve native projelere kopyalar.
- Kelime fotoğrafları (800 MB) uygulama paketine girmez; sunucudan indirilir. Paket ~25 MB.
- Ses tanıma (oyunlardaki SPEAK, AI Lex mikrofon), bildirimler (hatırlatma, Word Drop,
  seri, haftalık özet), Google ile giriş (deep link), durum çubuğu, açılış ekranı, geri tuşu.
- İkon ve açılış görseli `assets/icon.svg` ve `assets/splash.svg` dosyalarından üretilir.
  Gerçek logo geldiğinde bu iki dosyayı değiştirip `npx capacitor-assets generate` çalıştırılır.

## Supabase'de yapılacak (Google girişi telefonda çalışsın diye)
Authentication → URL Configuration → Redirect URLs listesine ekle:
```
app.lexistencehub://auth/callback
```

## Derleme ortamı
| Platform | Gerekli | Windows'ta |
|---|---|---|
| Android | Android Studio (JDK dahil) | Kurulabilir. `npx cap open android` → Build → Generate Signed Bundle (AAB). |
| iOS | macOS + Xcode | **Mümkün değil.** Bulut derleme (Codemagic) veya bir Mac. |

**Öneri: Codemagic** (codemagic.io) – GitHub deposuna bağlanır, hem iOS hem Android'i bulutta
derler, TestFlight ve Play Console'a otomatik yükler. Ücretsiz planda ayda 500 dakika
(bir derleme ~10–15 dk). Apple sertifikalarını Codemagic kendisi yönetebilir (App Store
Connect API anahtarı ile).

## Mağaza hesapları (senin açman gerekenler)
| | Apple App Store | Google Play |
|---|---|---|
| Ücret | 99 $/yıl | 25 $ tek seferlik |
| Adres | developer.apple.com/programs | play.google.com/console |
| Bireysel / şirket | İkisi de olur; şirket için D-U-N-S numarası gerekir (ücretsiz, 1–2 hafta) | İkisi de olur |
| Onay süresi | 1–2 gün (kimlik doğrulama) | 1–3 gün |
| Not | Mağazada geliştirici adı görünür (bireyselde kendi adın) | 2023+ bireysel hesaplarda yayından önce **12 test kullanıcısı ile 14 gün kapalı test** zorunlu |

## Abonelik (Faz 3)
- Dijital içerik satışı iki mağazada da yalnızca mağaza içi satın almayla yapılabilir.
- **RevenueCat** (revenuecat.com): iki mağazanın aboneliğini tek yerden yönetir, satın alma
  doğrulandığında sunucumuzdaki `entitlements` tablosuna Premium yazacak webhook'u buradan
  kuracağız. Aylık ~2.500 $ gelire kadar ücretsiz.
- Mağaza payı: ilk yıl / küçük işletme programlarında %15, sonrasında %30.
- Planlar: aylık ve yıllık Premium; fiyatlar App Store Connect ve Play Console'da tanımlanır.

## Yayın öncesi kontrol listesi
- [ ] Supabase → kendi SMTP sağlayıcısı (Brevo / Resend) – doğrulama e-postaları için şart.
- [ ] Google Auth Platform → Audience → **Publish app** (aksi halde yalnızca test kullanıcıları girer).
- [ ] Privacy Policy ve Terms için herkese açık web adresi (metinler hazır; `/privacy` ve `/terms` sayfaları olarak yayınlanabilir).
- [ ] Google için web üzerinden hesap silme sayfası (Play politikası).
- [ ] Ekran görüntüleri (6.7" iPhone, 6.5" iPhone, iPad opsiyonel; Android telefon), TR + EN açıklamalar, anahtar kelimeler.
- [ ] Yaş derecelendirmesi anketi; Apple "App Privacy" ve Google "Data Safety" formları
      (toplanan veri: e-posta, ad, öğrenme verileri; AI sohbetleri üçüncü tarafa – Google Gemini – gönderilir).
- [ ] İncelemeci için deneme hesabı (e-posta + şifre, Premium verilmiş).
- [ ] Vergi / banka bilgileri (mali müşavir ile).

## Sıra
1. Android Studio kur → `npm run build:native` → `npx cap open android` → telefonda çalıştır (USB veya APK).
2. Codemagic hesabı aç → GitHub'ı bağla → iOS derlemesi.
3. Apple Developer + Google Play hesapları (bekleme süresi olduğu için hemen başlat).
4. TestFlight (iOS) ve kapalı test (Android) – arkadaşlarla 14 gün.
5. RevenueCat + abonelikler.
6. Mağaza formları ve gönderim.
