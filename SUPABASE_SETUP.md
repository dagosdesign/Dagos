# Supabase kurulumu (Faz 1 – hesaplar ve bulut verisi)

Kod hazır. Bu adımlar tamamlanana kadar uygulama **eskisi gibi** çalışır (cihazda misafir, hesap yok).
Adımlar bitince: giriş / hesap oluşturma, ilerlemenin hesaba bağlanması ve AI uç noktalarında
Premium kontrolü kendiliğinden açılır.

## 1. Proje oluştur
1. https://supabase.com → **New project** (ücretsiz plan yeterli).
2. Region: **Frankfurt (eu-central-1)** – Türkiye'ye en yakın.
3. Veritabanı şifresini bir yere kaydet (uygulamada kullanılmıyor, yalnızca yönetim için).

## 2. Tabloları kur
1. Sol menü → **SQL Editor** → **New query**.
2. `supabase/schema.sql` dosyasının tamamını yapıştır → **Run**.
3. **Table Editor**'da şu tablolar görünmeli: `user_state`, `entitlements`, `ai_usage`, `support_messages`.

## 3. Giriş ayarları
**Authentication → Sign In / Providers**
- **Email**: açık. "Confirm email" **açık** kalsın (e-posta doğrulaması).
- Minimum şifre uzunluğu: **8**.

**Authentication → URL Configuration**
- **Site URL**: `https://lex-zmt3.onrender.com` (ileride kendi alan adın)
- **Redirect URLs**'e ekle: `https://lex-zmt3.onrender.com`, `http://localhost:3000`

> Google ve Apple ile giriş düğmeleri uygulamada hazır; sağlayıcı ayarları yapılana kadar
> "not available" uyarısı verir. Google için Google Cloud Console'da OAuth istemcisi,
> Apple için Apple Developer hesabı gerekir – bunları Faz 2'de birlikte açarız.

## 4. Anahtarları yerleştir
**Project Settings → API** sayfasından:

| Değer | Nereye | Gizli mi? |
|---|---|---|
| Project URL | `VITE_SUPABASE_URL` | Hayır |
| `anon` `public` key | `VITE_SUPABASE_ANON_KEY` | Hayır (RLS kuralları korur) |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` | **EVET – asla uygulamaya, git'e veya bana yazma** |

**Bilgisayarında:** proje klasöründeki `.env` dosyasına üç satırı ekle (örnek: `.env.example`).
Sonra geliştirme sunucusunu yeniden başlat.

**Render'da:** servis → **Environment** → aynı üç değişkeni ekle → **Save, rebuild and deploy**.
(`VITE_` ile başlayanlar derleme sırasında uygulamaya gömülür, bu yüzden yeniden derleme şart.)

## 5. E-posta gönderimi (önemli)
Supabase'in kendi e-posta servisi **saatte birkaç e-posta** ile sınırlıdır ve yalnızca deneme içindir.
Yayına çıkmadan önce: **Authentication → Emails → SMTP Settings** → kendi SMTP sağlayıcını gir
(Brevo / Resend / Google Workspace). Aynı SMTP bilgileri `.env` içindeki `SMTP_*` satırlarına da
yazılırsa Help & Support mesajları da e-postana düşer.

## 6. Dene
1. Uygulamada **Profile → Sign in or create an account** → hesap oluştur → gelen e-postadaki bağlantıya tıkla → giriş yap.
2. Birkaç etkinlik yap. Supabase → Table Editor → `user_state`: satırlar oluşmalı.
3. Başka bir tarayıcıda aynı hesapla giriş yap: ilerlemen gelmeli.

## 7. Bir hesabı Premium yapmak (satın alma gelene kadar)
Uygulamadaki "Upgrade" düğmesi artık planı **değiştirmez** – plan sunucuda tutulur.
Deneme için: Supabase → Table Editor → `entitlements` → **Insert row**:
- `user_id`: Authentication → Users listesindeki kullanıcının ID'si
- `plan`: `premium`
- `expires_at`: boş (süresiz) ya da bir tarih

Kullanıcı uygulamayı yeniden açınca Premium görünür. Faz 3'te bu satırı App Store / Google Play
satın alımı (RevenueCat) otomatik yazacak.

## Günlük AI limitleri (Premium kullanıcı başına)
Varsayılanlar: sohbet 300 mesaj, AI Speaking 20 görüşme, analiz 40, pratik 60.
Değiştirmek için sunucu ortam değişkenleri: `AI_DAILY_CHAT`, `AI_DAILY_SPEAKING`, `AI_DAILY_ANALYSIS`, `AI_DAILY_PRACTICE`.
