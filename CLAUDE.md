# Lexistencehub (Lexis) — proje notları

Türkçe konuşan öğrenciler için İngilizce öğrenme uygulaması. Mağaza adı **Lexistencehub**, appId `app.lexistencehub`.
Kullanıcıyla Türkçe konuş.

## Teknoloji
- Ön yüz: React 19 + Vite + TypeScript + Tailwind v4 (`src/`), ikonlar `lucide-react`, animasyon `motion`
- Sunucu: Express (`server.ts`) + `authGuard.ts`, `supportApi.ts`, `publicPages.ts`, `mailer.ts`
- AI: Gemini (`@google/genai`), anahtar sadece sunucuda (`GEMINI_API_KEY`)
- Hesap ve bulut verisi: Supabase (`supabase/schema.sql`, RLS açık). Tablolar: `user_state`, `entitlements`, `ai_usage`, `support_messages`
- Mobil: Capacitor 8 (`android/`, `ios/`). `npm run build:native` web kısmını `.env.native` ile derleyip native projelere kopyalar
- Canlı sunucu: Render, `https://lex-zmt3.onrender.com`
- Tasarım: koyu arka plan, şampanya/altın vurgu, Cormorant Garamond + Inter + JetBrains Mono. Bu dili koru.

## Komutlar
- `npm run dev` → yerel sunucu (localhost:3000)
- `npm run lint` → `tsc --noEmit`
- `npm run build:native` → mobil derleme + `npx cap sync`
- `npx cap open android` → Android Studio

## Belgeler
- `MOBILE_RELEASE.md` — mağaza yol haritası (Faz 2–5)
- `SUPABASE_SETUP.md` — Supabase kurulumu

## Son oturumda yapılanlar (Eylül 2026, Cowork)
Güvenlik incelemesi ve düzeltmeler:
1. **Eski cihaz tabanlı hesap sistemi kaldırıldı.** `/api/account/:id`, `request-code`, `confirm`, `delete` artık yok.
   E-posta/şifre/silme sadece Supabase üzerinden (`src/lib/auth.ts`, `AccountPage.tsx`, `AccountSettingsPage.tsx`, `HelpSupportPage.tsx`).
   `accountApi.ts` artık kullanılmıyor, silinebilir.
2. **AI uçları sıkılaştırıldı** (`authGuard.ts`, `server.ts`):
   - `/api/check-translation`, `/api/practice-content`, `/api/generate-quiz` artık giriş istiyor (`guard({ signedIn: true })`) ve kullanıcı başına günlük limitli (translation 400, practice_content 100, quiz 30; `AI_DAILY_<FEATURE>` ile değişir). İstemci bu uçlar için `apiFetch` kullanıyor (token gönderir); misafirde yerel yedeklere düşülüyor.
   - Quiz `count` 1–10 arası, tema ≤100 karakter; çeviri/kelime alanlarında uzunluk sınırı.
   - `/api/chat`: son mesaj ≤2000 karakter, modele en fazla son 30 mesaj / 24k karakter gider.
   - Üretimde Supabase service anahtarı yoksa AI uçları **kapanır** (fail closed), eskiden herkese açılıyordu.
   - `express.json({ limit: "100kb" })`.
- Tip kontrolü temiz. Değişiklikler henüz Render'a deploy edilmemiş olabilir.

## Güvenlik notları
- Yapıldı (25 Eyl 2026): hata yanıtlarından `details` kaldırıldı; `helmet` eklendi (CSP kapalı, CORP cross-origin);
  `/api` için Capacitor kaynaklarına (`https://localhost`, `capacitor://localhost`) CORS eklendi; `.env` git geçmişinde yok.
- Kalan: ücretsiz plan günlük limitleri (kelime/oyun) sadece istemcide tutuluyor.

## Grammar Duel (Eyl 2026)
- Her level 20 soru: 10 tense + 10 diğer gramer. Oyun (`GrammarDuelScreen.tsx` → `buildRound`) bunu zorunlu kılar;
  tense başına ≤2, Level 5+ Present Simple ≤1, aynı konu art arda gelmez.
- Banka `scripts/generate-grammar-duels.mjs` ile üretilir (tense/konu açılış seviyeleri betikte). `PLAN=1` planı gösterir,
  `LEVEL=18-50` sadece o seviyeleri üretir, önbellek `scripts/.cache/grammar-v2`.
- Tamamlandı (30 Eyl 2026): 50 levelin hepsi yeni formatta, 2065 soru (level başına ≥28, her levelde ≥12 tense).
  Tense'i az kalan levellere betik otomatik "sadece tense" ek turu üretir. İnceleme `r2-` önekli önbellek
  dosyalarında; inceleme kuralları değişirse öneki artır.

## Uygulama içi satın alma (RevenueCat, Eyl 2026)
- Akış: `PremiumOffer.tsx` (tek satış kartı; Subscription sayfası + PlanLimitCard) → `src/lib/billing.ts`
  (`@revenuecat/purchases-capacitor`, appUserID = Supabase user id) → mağaza → RevenueCat →
  sunucu `billing.ts`: `/api/billing/webhook` + `/api/billing/sync` → `entitlements` tablosu → uygulama `refreshPlan()`.
- Sunucu olayın gövdesine değil RevenueCat API'sine (`GET /v1/subscribers/:id`) bakar. `source='manual'` Premium'a dokunmaz (inceleme hesabı).
- Uygulama Premium'u kendisi açamaz (`setMembership` kaldırıldı). Webde satın alma yok.
- Env: sunucu `REVENUECAT_SECRET_KEY`, `REVENUECAT_WEBHOOK_AUTH`, `REVENUECAT_ENTITLEMENT` (premium);
  `.env.native` `VITE_REVENUECAT_ANDROID_KEY` / `VITE_REVENUECAT_IOS_KEY`.

## Kelime görselleri
- `media/vocabulary/<kelime>.webp` (oval, altın halkalı, 750×1000). Sunucu GitHub'dan alır: **push edilmeden canlıya çıkmaz**
  (Render'daki "deploy" GitHub'a bir şey göndermez).
- Üretim: sahneler `scripts/scenes-*.json` → `node scripts/generate-card-photos.mjs <ham_klasör> <sahneler.json>` →
  `node scripts/process-card-photos.mjs <ham_klasör>` (Python sürümünün Node eşi; bu makinede Python yok).
- Var olan bir görsel DEĞİŞTİRİLİRSE `MethodPracticeScreen.tsx` → `PHOTO_VERSION` artırılır (telefonlar görseli 30 gün
  önbellekte tutar) ve yeni AAB gerekir. Yeni kelime eklemek için gerekmez.
- Zarflar (Eki 2026): 44 zarf `scripts/scenes-adverbs-ideas.json` ile yeniden çizildi; eskileri `scripts/.cache/adverbs-ideas/old`.

## Şu anki adım: Android
- Android Studio kuruldu, Node.js kuruldu, `npm install` + `npm run build:native` + `npx cap open android` çalıştırıldı, Gradle sync yapılıyordu.
- Sıradaki: telefonda USB hata ayıklama ile ▶ Run → uygulamayı test et (açılış, fotoğraflar, giriş, mikrofon, bildirim).
- Sonra: imzalı AAB (Build → Generate Signed App Bundle). Keystore proje dışında saklanmalı ve yedeklenmeli. Her yüklemede `android/app/build.gradle` → `versionCode` artır.
- Paralel: Google Play Console hesabı, 12 kişilik 14 günlük kapalı test, Supabase Redirect URLs'e `app.lexistencehub://auth/callback`.
- Proje yolunda boşluk/parantez var (`E:\1-HUAWEI LAPTOP (D)\...`); garip Gradle hatası çıkarsa kısa bir yola (örn. `C:\dev\lexist`) kopyalanabilir.
