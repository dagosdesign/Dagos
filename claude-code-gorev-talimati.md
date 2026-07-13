# Görev: İngilizce Öğrenme Uygulamasını Kapsamlı Hale Getir

## Mevcut Proje
Vite + React 19 + TypeScript + Express (server.ts) tabanlı bir kelime testi uygulaması.
- `@google/genai` ile Gemini API üzerinden canlı soru üretimi
- `src/data/staticQuestions.ts` içinde yedek statik soru havuzu
- `src/App.tsx` tek dosyada tüm quiz mantığı ve arayüz

## Tasarım Sistemi (KORUNACAK — değiştirme)
- Arka plan: `#0a0a0b` (neredeyse siyah)
- Ana vurgu rengi: `#c5a47e` (şampanya/altın)
- Metin: `#dcdcdc`, ikincil metin `white/40-60` opacity tonları
- Başlık fontu: `Cormorant Garamond` italik serif
- Gövde fontu: `Inter`
- Veri/istatistik fontu: `JetBrains Mono`
- Kart stili: `bg-white/[0.02]`, `border border-white/[0.06]`, `rounded-2xl`, ince gölgeler
- Genel his: sakin, lüks, minimal — kalabalık değil

## İstenen Yeni Özellikler

### 1. Kelime Kartları + Aralıklı Tekrar (Spaced Repetition / SRS)
- Her kelime için: interval, ease factor, sonraki tekrar tarihi (localStorage veya basit dosya tabanlı kalıcı depolama)
- Kart arayüzü: ön yüz İngilizce kelime, arka yüz Türkçe anlam + örnek cümle
- Değerlendirme butonları: Zor / İyi / Kolay (SM-2 benzeri basit algoritma)
- "Bugün tekrar edilecek kartlar" listesi ana ekranda öne çıksın

### 2. Gramer Dersleri Modülü
- En az 6-8 konu (Present Simple, Present Continuous, Past Simple, Present Perfect, Comparatives, Conditionals vb.)
- Her konu: kısa açıklama + örnek cümle + 3-5 soruluk mini test
- Tamamlanma durumu kaydedilsin

### 3. Karma Test Modu
- Mevcut Gemini destekli quiz sistemini koru, ama gramer sorularını da karışıma dahil et
- Sonuç ekranında doğru/yanlış dağılımı

### 4. İlerleme / Profil Ekranı
- Seri (streak), toplam XP, ustalaşılan kelime sayısı/yüzdesi
- Basit bir görsel ilerleme göstergesi (mevcut altın vurgu rengiyle uyumlu)

### 5. Navigasyon
- Mobil öncelikli, alt sekme çubuğu: Ana Sayfa / Kartlar / Test / Gramer
- Mevcut header/istatistik çubuğunu koruyarak üstte tut

## Teknik Notlar
- Mevcut TypeScript + Tailwind v4 yapısını kullan
- `lucide-react` zaten yüklü, ikonlar için onu kullan
- `motion` (framer-motion benzeri) zaten bağımlılıklarda — kart çevirme animasyonu için kullanılabilir
- Kalıcılık için basit bir JSON dosyası veya localStorage yeterli (backend veritabanı şart değil)
- Gemini API bağımlılığını bozma; API anahtarı yoksa `staticQuestions.ts` yedeğine düşen mevcut mantığı koru

## Öncelik Sırası (aşamalı ilerlemek istersen)
1. Kelime kartları + SRS sistemi
2. Gramer modülü
3. İlerleme ekranı + navigasyon
4. Karma test entegrasyonu
