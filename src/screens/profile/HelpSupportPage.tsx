import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, CircleCheck, Mail, Search } from 'lucide-react';
import { C, Card, GoldButton, SubPage } from '../../components/profile/ui';
import { useUserProfile } from '../../lib/userProfile';
import { apiFetch } from '../../lib/api';
import { apiUrl } from '../../lib/runtime';

/* HELP & SUPPORT: answers first (searchable), then a direct message to the
   Lexistencehub team. The reply comes by e-mail; every message gets a reference
   and stays listed here on the device. See supportApi.ts. */

type Lang = 'tr' | 'en';
type Faq = { group: string; items: { q: string; a: string }[] }[];

const FAQ: Record<Lang, Faq> = {
  tr: [
    {
      group: 'Öğrenme',
      items: [
        {
          q: 'Seviyem nasıl belirleniyor?',
          a: 'Check Your Level, cevaplarınıza göre ilerleyen bir gramer testidir. İyi cevaplardan sonra zorlaşır, zayıf cevaplardan sonra kolaylaşır ve sizi A1 ile C2 arasında bir seviyeye yerleştirir. Sonuç profilinize kaydedilir.',
        },
        {
          q: 'Öğrenme süresi nasıl hesaplanıyor?',
          a: 'Bir öğrenme ekranı - oyun, pratik, gramer testi, kelime kartları veya AI Lex - açık ve görünür olduğu sürece süre eklenir.',
        },
        { q: 'Seri (streak) nasıl çalışır?', a: 'Her gün en az bir etkinlik tamamlayın. Bir gün atlanırsa seri baştan başlar.' },
        {
          q: 'Performance Analysis neye dayanıyor?',
          a: 'Yalnızca sizin verdiğiniz cevaplara. Bir konu en az 10 cevaptan sonra değerlendirilir, yeni cevaplar daha ağırlıklıdır ve hiç denemediğiniz konular zayıf olarak gösterilmez.',
        },
      ],
    },
    {
      group: 'Üyelik',
      items: [
        {
          q: 'Free plan neleri kapsıyor?',
          a: 'Her gün: 10 kelime, 3 oyun, 1 gramer etkinliği ve 1 dinleme etkinliği; ayrıca temel ilerleme takibi ve günlük görev. Limitler her gün yenilenir.',
        },
        {
          q: 'Premium neler ekliyor?',
          a: 'Sınırsız kelime, oyun, gramer ve dinleme; AI Lex sohbetleri ve AI Speaking; ayrıntılı istatistikler ve Performance Analysis.',
        },
      ],
    },
    {
      group: 'Hesap ve Veriler',
      items: [
        {
          q: 'E-postamı veya şifremi nasıl değiştiririm?',
          a: 'Settings bölümünden Account sayfasını açın. Her değişiklik, e-posta veya SMS ile gönderilen 6 haneli bir kodla onaylanır.',
        },
        {
          q: 'İstatistiklerimi nasıl sıfırlarım?',
          a: 'Settings bölümünden Data & Privacy sayfasını açın. Quiz istatistikleri, performans verileri ve öğrenme geçmişi ayrı ayrı sıfırlanabilir.',
        },
        {
          q: 'Hesabımı nasıl silerim?',
          a: 'Delete Account, Settings sayfasının en altındadır. Profilinizi ve tüm öğrenme verilerinizi siler; bu işlem geri alınamaz.',
        },
      ],
    },
    {
      group: 'AI Lex ve Speaking',
      items: [
        {
          q: 'AI Speaking beni duymuyor.',
          a: 'Tarayıcı veya telefon ayarlarından Lexistencehub için mikrofon iznini açın, ardından görüşmeyi yeniden başlatın. Gürültülü ortamlarda kulaklık kullanmak yardımcı olur.',
        },
        {
          q: 'AI sohbetlerim gizli mi?',
          a: 'Gönderdiğiniz mesajlar, cevapların oluşturulması için bir yapay zekâ hizmeti tarafından işlenir. Bu sohbetlerde hassas kişisel bilgilerinizi paylaşmayın.',
        },
      ],
    },
  ],
  en: [
    {
      group: 'Learning',
      items: [
        {
          q: 'How is my level decided?',
          a: 'Check Your Level is an adaptive grammar test. It moves up after strong answers and down after weak ones, and places you between A1 and C2. The result is saved to your profile.',
        },
        {
          q: 'How is learning time counted?',
          a: 'Time is added while a learning screen - a game, practice session, grammar test, word cards or AI Lex - is open and visible.',
        },
        { q: 'How do streaks work?', a: 'Complete at least one activity every day. Missing a day starts the streak again.' },
        {
          q: 'What is Performance Analysis based on?',
          a: 'Only on your own answers. A topic is scored after at least 10 answers, recent answers count more, and topics you have not tried are never shown as weak.',
        },
      ],
    },
    {
      group: 'Membership',
      items: [
        {
          q: 'What does the Free plan include?',
          a: 'Every day: 10 words, 3 games, 1 grammar activity and 1 listening activity, plus basic progress tracking and the daily challenge. Limits start over each day.',
        },
        {
          q: 'What does Premium add?',
          a: 'Unlimited words, games, grammar and listening, AI Lex conversations and AI Speaking, detailed statistics and Performance Analysis.',
        },
      ],
    },
    {
      group: 'Account & Data',
      items: [
        {
          q: 'How do I change my e-mail or password?',
          a: 'Open Settings, then Account. Every change is confirmed with a 6-digit code sent by e-mail or SMS.',
        },
        {
          q: 'How do I reset my statistics?',
          a: 'Open Settings, then Data & Privacy. Quiz statistics, performance data and learning history can each be reset on their own.',
        },
        {
          q: 'How do I delete my account?',
          a: 'Delete Account is at the bottom of Settings. It removes your profile and all learning data, and cannot be undone.',
        },
      ],
    },
    {
      group: 'AI Lex & Speaking',
      items: [
        {
          q: 'AI Speaking cannot hear me.',
          a: 'Allow microphone access for Lexistencehub in your browser or phone settings, then start the call again. Headphones help in noisy places.',
        },
        {
          q: 'Are my AI conversations private?',
          a: 'The messages you send are processed by an AI service to create the replies. Do not share sensitive personal information in these conversations.',
        },
      ],
    },
  ],
};

// The topic goes to the team in English; the student sees it in their language.
const TOPICS = ['Question', 'Problem', 'Membership & Payment', 'Suggestion', 'Other'];
const TOPIC_TR: Record<string, string> = {
  Question: 'Soru',
  Problem: 'Sorun',
  'Membership & Payment': 'Üyelik ve Ödeme',
  Suggestion: 'Öneri',
  Other: 'Diğer',
};

const TEXT = {
  tr: {
    subtitle: 'Cevap bulun veya bize yazın',
    search: 'Yardımda ara',
    noAnswer: (q: string) => `“${q}” için bir cevap bulunamadı. Aşağıdan bize yazın, yardımcı olalım.`,
    contact: 'Bize Ulaşın',
    contactIntro: 'Lexistencehub ekibine yazın. E-posta ile yanıt veriyoruz.',
    topic: 'Konu',
    email: 'E-posta adresiniz',
    message: 'Mesajınız',
    placeholder: 'Size nasıl yardımcı olabiliriz?',
    placeholderProblem: 'Ne oldu ve hangi ekranda oldu?',
    send: 'Mesajı gönder',
    sending: 'Gönderiliyor…',
    note: 'Daha hızlı yardımcı olabilmemiz için planınız, seviyeniz ve cihaz türünüz mesaja eklenir.',
    received: 'Mesajınız alındı',
    reference: 'Referans numaranız',
    replyTo: (mail: string) => `${mail} adresine e-posta ile yanıt vereceğiz.`,
    another: 'Başka bir mesaj gönder',
    yours: 'Mesajlarınız',
    badEmail: 'Size yanıt verebilmemiz için geçerli bir e-posta adresi girin.',
    tooShort: 'Lütfen sorunuzu biraz daha ayrıntılı anlatın.',
    tooMany: 'Birkaç mesaj gönderdiniz. Lütfen bir saat sonra tekrar deneyin.',
    failed: 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.',
  },
  en: {
    subtitle: 'Find an answer or write to us',
    search: 'Search help',
    noAnswer: (q: string) => `No answer found for “${q}”. Write to us below and we will help.`,
    contact: 'Contact Us',
    contactIntro: 'Write to the Lexistencehub team. We reply by e-mail.',
    topic: 'Topic',
    email: 'Your e-mail',
    message: 'Your message',
    placeholder: 'How can we help?',
    placeholderProblem: 'What happened, and on which screen?',
    send: 'Send message',
    sending: 'Sending…',
    note: 'Your plan, level and device type are added to the message so we can help faster.',
    received: 'Message received',
    reference: 'Your reference is',
    replyTo: (mail: string) => `We will reply by e-mail to ${mail}.`,
    another: 'Send another message',
    yours: 'Your Messages',
    badEmail: 'Enter a valid e-mail address so we can reply.',
    tooShort: 'Please describe your question in a little more detail.',
    tooMany: 'You have sent several messages. Please try again in an hour.',
    failed: 'Your message could not be sent. Please try again.',
  },
};

const SENT_KEY = 'lex_support_messages';
const MAX_MESSAGE = 2000;

interface SentMessage {
  ref: string;
  at: number;
  topic: string;
  message: string;
}

function loadSent(): SentMessage[] {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="px-1 text-[12px] font-semibold tracking-[0.14em] uppercase" style={{ color: C.gold }}>
      {children}
    </p>
  );
}

export default function HelpSupportPage({ onBack }: { onBack: () => void }) {
  const profile = useUserProfile();
  // The page opens in Turkish; the tabs at the top switch the language.
  const [lang, setLang] = useState<Lang>('tr');
  const T = TEXT[lang];
  const [query, setQuery] = useState('');
  const [openQ, setOpenQ] = useState<string | null>(null);

  const [topic, setTopic] = useState(TOPICS[0]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // hidden: only bots fill it in
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [sent, setSent] = useState<SentMessage[]>(loadSent);

  // The confirmed account e-mail, when there is one, is where the reply goes.
  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl(`/api/account/${encodeURIComponent(profile.id)}`))
      .then(r => r.json())
      .then(a => !cancelled && a?.email && setEmail(prev => prev || a.email))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ[lang];
    return FAQ[lang].map(g => ({ ...g, items: g.items.filter(i => `${i.q} ${i.a}`.toLowerCase().includes(q)) })).filter(g => g.items.length);
  }, [query, lang]);

  const send = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError(T.badEmail);
    if (message.trim().length < 10) return setError(T.tooShort);
    setBusy(true);
    try {
      const r = await apiFetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          topic,
          email: email.trim(),
          message: message.trim(),
          website,
          // What the team needs to understand the question without asking back.
          context: {
            name: profile.name,
            plan: profile.membership,
            level: profile.placementTestCompleted ? profile.level : 'not assessed',
            device: navigator.userAgent,
            screen: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            pageLanguage: lang,
          },
        }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || !body.ref) throw new Error(r.status === 429 ? T.tooMany : T.failed);
      const next = [{ ref: body.ref, at: Date.now(), topic, message: message.trim() }, ...sent].slice(0, 20);
      setSent(next);
      try {
        localStorage.setItem(SENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      setDone(body.ref);
      setMessage('');
    } catch (e: any) {
      setError(e?.message && Object.values(T).includes(e.message) ? e.message : T.failed);
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-2xl border px-4 py-3 text-[15px] outline-none focus:border-[#F5B82E]';
  const fieldStyle = { background: C.card2, borderColor: C.border, color: C.text };

  return (
    <SubPage title="Help & Support" subtitle={T.subtitle} onBack={onBack}>
      {/* Language */}
      <div role="tablist" aria-label="Language" className="grid grid-cols-2 gap-1 rounded-2xl border p-1" style={{ background: C.card, borderColor: C.border }}>
        {(['tr', 'en'] as Lang[]).map(l => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={lang === l}
            onClick={() => {
              setLang(l);
              setOpenQ(null);
              setQuery('');
              setError(null);
            }}
            className="rounded-xl py-2.5 text-[14px] font-semibold cursor-pointer transition-colors"
            style={lang === l ? { background: C.gold, color: '#0B0B0B' } : { background: 'transparent', color: C.muted }}
          >
            {l === 'tr' ? 'Türkçe' : 'English'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" color={C.muted} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={T.search}
          className={`${field} pl-11`}
          style={fieldStyle}
        />
      </div>

      {/* Answers */}
      {groups.length === 0 ? (
        <Card className="p-5">
          <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            {T.noAnswer(query)}
          </p>
        </Card>
      ) : (
        groups.map(g => (
          <section key={g.group} className="space-y-2.5">
            <GroupLabel>{g.group}</GroupLabel>
            <Card className="divide-y divide-[#262626] overflow-hidden">
              {g.items.map(i => {
                const open = openQ === i.q;
                return (
                  <div key={i.q}>
                    <button
                      type="button"
                      onClick={() => setOpenQ(open ? null : i.q)}
                      aria-expanded={open}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer"
                    >
                      <span className="flex-1 text-[15px] font-medium" style={{ color: C.text }}>
                        {i.q}
                      </span>
                      <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} color={open ? C.gold : C.muted} />
                    </button>
                    {open && (
                      <p className="px-4 pb-4 text-[14px] leading-relaxed" style={{ color: C.muted }}>
                        {i.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </Card>
          </section>
        ))
      )}

      {/* Contact */}
      <section className="space-y-2.5">
        <GroupLabel>{T.contact}</GroupLabel>
        <Card className="p-5 space-y-4" glow>
          {done ? (
            <div className="text-center space-y-2 py-2">
              <CircleCheck className="w-9 h-9 mx-auto" color={C.gold} strokeWidth={1.6} />
              <p className="text-[17px] font-semibold" style={{ color: C.text }}>
                {T.received}
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
                {T.reference} <span style={{ color: C.gold }}>{done}</span>. {T.replyTo(email.trim())}
              </p>
              <button type="button" onClick={() => setDone(null)} className="text-[14px] pt-1 cursor-pointer" style={{ color: C.gold }}>
                {T.another}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <Mail className="w-[18px] h-[18px]" color={C.gold} />
                <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
                  {T.contactIntro}
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[12.5px]" style={{ color: C.muted }}>
                  {T.topic}
                </p>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      className="px-3.5 py-2 rounded-full border text-[13px] cursor-pointer"
                      style={{
                        background: topic === t ? C.goldDim : C.card2,
                        borderColor: topic === t ? 'rgba(245,184,46,0.55)' : C.border,
                        color: topic === t ? C.gold : C.text,
                      }}
                    >
                      {lang === 'tr' ? TOPIC_TR[t] : t}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-[12.5px]" style={{ color: C.muted }}>
                  {T.email}
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                  className={field}
                  style={fieldStyle}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="flex justify-between text-[12.5px]" style={{ color: C.muted }}>
                  <span>{T.message}</span>
                  <span>
                    {message.length} / {MAX_MESSAGE}
                  </span>
                </span>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                  rows={5}
                  placeholder={topic === 'Problem' ? T.placeholderProblem : T.placeholder}
                  className={`${field} resize-none leading-relaxed`}
                  style={fieldStyle}
                />
              </label>

              <input
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="hidden"
                name="website"
              />

              {error && (
                <p className="text-[13px]" style={{ color: C.gold }}>
                  {error}
                </p>
              )}
              <GoldButton onClick={send} disabled={busy}>
                {busy ? T.sending : T.send}
              </GoldButton>
              <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
                {T.note}
              </p>
            </>
          )}
        </Card>
      </section>

      {/* Sent messages */}
      {sent.length > 0 && (
        <section className="space-y-2.5">
          <GroupLabel>{T.yours}</GroupLabel>
          <Card className="divide-y divide-[#262626]">
            {sent.map(m => (
              <div key={m.ref} className="px-4 py-3.5 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold" style={{ color: C.gold }}>
                    {m.ref} · {lang === 'tr' ? TOPIC_TR[m.topic] ?? m.topic : m.topic}
                  </p>
                  <p className="text-[12px] shrink-0" style={{ color: C.muted }}>
                    {new Date(m.at).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB')}
                  </p>
                </div>
                <p className="text-[14px] leading-relaxed line-clamp-2" style={{ color: C.text }}>
                  {m.message}
                </p>
              </div>
            ))}
          </Card>
        </section>
      )}
    </SubPage>
  );
}
