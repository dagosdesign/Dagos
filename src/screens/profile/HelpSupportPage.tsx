import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, CircleCheck, Mail, Search } from 'lucide-react';
import { C, Card, GoldButton, SubPage } from '../../components/profile/ui';
import { useUserProfile } from '../../lib/userProfile';

/* HELP & SUPPORT: answers first (searchable), then a direct message to the
   Lexistencehub team. The reply comes by e-mail; every message gets a reference
   and stays listed here on the device. See supportApi.ts. */

const FAQ: { group: string; items: { q: string; a: string }[] }[] = [
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
];

const TOPICS = ['Question', 'Problem', 'Membership & Payment', 'Suggestion', 'Other'];
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
    fetch(`/api/account/${encodeURIComponent(profile.id)}`)
      .then(r => r.json())
      .then(a => !cancelled && a?.email && setEmail(prev => prev || a.email))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile.id]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ;
    return FAQ.map(g => ({ ...g, items: g.items.filter(i => `${i.q} ${i.a}`.toLowerCase().includes(q)) })).filter(g => g.items.length);
  }, [query]);

  const send = async () => {
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Enter a valid e-mail address so we can reply.');
    if (message.trim().length < 10) return setError('Please describe your question in a little more detail.');
    setBusy(true);
    try {
      const r = await fetch('/api/support', {
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
          },
        }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok || !body.ref) throw new Error(body.message || 'Your message could not be sent. Please try again.');
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
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const field = 'w-full rounded-2xl border px-4 py-3 text-[15px] outline-none focus:border-[#F5B82E]';
  const fieldStyle = { background: C.card2, borderColor: C.border, color: C.text };

  return (
    <SubPage title="Help & Support" subtitle="Find an answer or write to us" onBack={onBack}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]" color={C.muted} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search help"
          className={`${field} pl-11`}
          style={fieldStyle}
        />
      </div>

      {/* Answers */}
      {groups.length === 0 ? (
        <Card className="p-5">
          <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
            No answer found for “{query}”. Write to us below and we will help.
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
        <GroupLabel>Contact Us</GroupLabel>
        <Card className="p-5 space-y-4" glow>
          {done ? (
            <div className="text-center space-y-2 py-2">
              <CircleCheck className="w-9 h-9 mx-auto" color={C.gold} strokeWidth={1.6} />
              <p className="text-[17px] font-semibold" style={{ color: C.text }}>
                Message received
              </p>
              <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
                Your reference is <span style={{ color: C.gold }}>{done}</span>. We will reply by e-mail to {email.trim()}.
              </p>
              <button type="button" onClick={() => setDone(null)} className="text-[14px] pt-1 cursor-pointer" style={{ color: C.gold }}>
                Send another message
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <Mail className="w-[18px] h-[18px]" color={C.gold} />
                <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
                  Write to the Lexistencehub team. We reply by e-mail.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[12.5px]" style={{ color: C.muted }}>
                  Topic
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
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-[12.5px]" style={{ color: C.muted }}>
                  Your e-mail
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
                  <span>Your message</span>
                  <span>
                    {message.length} / {MAX_MESSAGE}
                  </span>
                </span>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
                  rows={5}
                  placeholder={topic === 'Problem' ? 'What happened, and on which screen?' : 'How can we help?'}
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
                {busy ? 'Sending…' : 'Send message'}
              </GoldButton>
              <p className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
                Your plan, level and device type are added to the message so we can help faster.
              </p>
            </>
          )}
        </Card>
      </section>

      {/* Sent messages */}
      {sent.length > 0 && (
        <section className="space-y-2.5">
          <GroupLabel>Your Messages</GroupLabel>
          <Card className="divide-y divide-[#262626]">
            {sent.map(m => (
              <div key={m.ref} className="px-4 py-3.5 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-semibold" style={{ color: C.gold }}>
                    {m.ref} · {m.topic}
                  </p>
                  <p className="text-[12px] shrink-0" style={{ color: C.muted }}>
                    {new Date(m.at).toLocaleDateString()}
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
