import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Pencil,
  Check,
  Crown,
  Sparkles,
  Rocket,
  ShieldCheck,
  Layers,
  ArrowRight,
  RotateCcw,
  Flame,
  Zap,
} from 'lucide-react';
import ProgressScreen from './ProgressScreen';
import { loadJSON, saveJSON, STORAGE_KEYS, defaultProfile, UserProfile, PlanId } from '../lib/storage';
import { GamificationState, GrammarProgressState, SrsState } from '../types';

interface ProfileScreenProps {
  gamification: GamificationState;
  srsState: SrsState;
  grammarProgress: GrammarProgressState;
  quizStats: { score: number; totalAnswered: number; highStreak: number };
  dueCount: number;
  onBack: () => void;
  onOpenCards: () => void;
  onResetStats: () => void;
}

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  icon: typeof Crown;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: '₺0',
    icon: ShieldCheck,
    features: ['Temel kelime desteleri', 'Günde 5 AI Coach mesajı', 'Standart testler'],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₺49/ay',
    icon: Sparkles,
    highlight: true,
    features: ['Sınırsız AI Coach sohbeti', 'Tüm kelime desteleri', 'Reklamsız deneyim', 'Detaylı ilerleme analizi'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₺89/ay',
    icon: Rocket,
    features: ['Premium’daki her şey', 'Kişisel çalışma planı', 'Öncelikli destek', 'Sınav simülasyonları'],
  },
];

const PLAN_LABEL: Record<PlanId, string> = {
  free: 'Ücretsiz Üye',
  premium: 'Premium Üye',
  pro: 'Pro Üye',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfileScreen(props: ProfileScreenProps) {
  const { gamification, srsState, grammarProgress, quizStats, dueCount, onBack, onOpenCards, onResetStats } = props;

  const [profile, setProfile] = useState<UserProfile>(() => loadJSON(STORAGE_KEYS.profile, defaultProfile()));
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.name);
  const [draftEmail, setDraftEmail] = useState(profile.email);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => saveJSON(STORAGE_KEYS.profile, profile), [profile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const saveEdit = () => {
    setProfile(p => ({ ...p, name: draftName.trim() || 'Öğrenci', email: draftEmail.trim() }));
    setEditing(false);
    setToast('Profil güncellendi');
  };

  const choosePlan = (plan: Plan) => {
    if (plan.id === profile.plan) return;
    if (plan.id === 'free') {
      setProfile(p => ({ ...p, plan: 'free' }));
      setToast('Ücretsiz pakete geçildi');
    } else {
      // No real payment collection — surface a friendly placeholder.
      setToast(`${plan.name} paketi çok yakında! Ödeme entegrasyonu hazırlanıyor.`);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-mono text-white/40 hover:text-[#e3b553] transition-colors cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </button>

      {/* User header card */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 shadow-md">
        {editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Pencil className="w-4 h-4 text-[#e3b553]" />
              <span className="text-xs font-mono uppercase tracking-widest text-white/40">Profili Düzenle</span>
            </div>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Adın"
              className="w-full text-sm bg-white/[0.02] border border-white/[0.08] focus:border-[#e3b553] focus:ring-1 focus:ring-[#e3b553] rounded-xl px-4 py-3 outline-hidden text-white font-light placeholder-white/25"
            />
            <input
              value={draftEmail}
              onChange={(e) => setDraftEmail(e.target.value)}
              placeholder="E-posta (opsiyonel)"
              className="w-full text-sm bg-white/[0.02] border border-white/[0.08] focus:border-[#e3b553] focus:ring-1 focus:ring-[#e3b553] rounded-xl px-4 py-3 outline-hidden text-white font-light placeholder-white/25"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setEditing(false); setDraftName(profile.name); setDraftEmail(profile.email); }} className="text-xs font-mono text-white/40 hover:text-white/70 px-3 py-2 cursor-pointer">
                Vazgeç
              </button>
              <button onClick={saveEdit} className="flex items-center gap-1.5 bg-[#e3b553] text-[#0a0a0b] rounded-xl px-4 py-2 text-xs font-bold cursor-pointer">
                <Check className="w-3.5 h-3.5" /> Kaydet
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-serif font-bold text-[#0a0a0b] shrink-0"
              style={{ background: 'linear-gradient(145deg, #ffd978, #d2a442)' }}
            >
              {initials(profile.name)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-serif italic text-white truncate">{profile.name}</h1>
              <p className="text-xs text-white/40 font-mono truncate">{profile.email || 'e-posta eklenmedi'}</p>
              <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-mono uppercase tracking-widest text-[#e3b553] bg-[#e3b553]/10 border border-[#e3b553]/20 px-2 py-0.5 rounded-md">
                <Crown className="w-3 h-3" /> {PLAN_LABEL[profile.plan]}
              </span>
            </div>
            <button
              onClick={() => { setDraftName(profile.name); setDraftEmail(profile.email); setEditing(true); }}
              className="p-2 text-white/40 hover:text-[#e3b553] hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer shrink-0"
              aria-label="Profili düzenle"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Quick streak / xp strip */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5">
            <Flame className="w-4 h-4 text-[#e3b553]" />
            <span className="text-sm font-mono font-bold text-white">{gamification.streakDays}</span>
            <span className="text-[10px] text-white/40 font-mono">gün seri</span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5">
            <Zap className="w-4 h-4 text-[#e3b553]" />
            <span className="text-sm font-mono font-bold text-white">{gamification.xp}</span>
            <span className="text-[10px] text-white/40 font-mono">XP</span>
          </div>
        </div>
      </div>

      {/* Membership plans */}
      <div>
        <h2 className="text-sm font-serif italic text-white flex items-center gap-2 mb-3 px-1">
          <Crown className="w-4 h-4 text-[#e3b553]" /> Üyelik Paketleri
        </h2>
        <div className="space-y-3">
          {PLANS.map(plan => {
            const Icon = plan.icon;
            const isCurrent = profile.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl border p-5 transition-all ${
                  plan.highlight && !isCurrent
                    ? 'bg-[#e3b553]/[0.06] border-[#e3b553]/30'
                    : isCurrent
                      ? 'bg-[#e3b553]/[0.1] border-[#e3b553]/50'
                      : 'bg-white/[0.02] border-white/[0.06]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/20 rounded-xl">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-serif italic text-white flex items-center gap-2">
                        {plan.name}
                        {plan.highlight && (
                          <span className="text-[9px] font-mono uppercase tracking-widest text-[#0a0a0b] bg-[#e3b553] px-1.5 py-0.5 rounded">Popüler</span>
                        )}
                      </h3>
                      <p className="text-sm font-mono text-[#e3b553]">{plan.price}</p>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#e3b553] shrink-0">
                      <Check className="w-3.5 h-3.5" /> Aktif
                    </span>
                  )}
                </div>

                <ul className="mt-3 space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/60 font-light">
                      <Check className="w-3.5 h-3.5 text-[#e3b553] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {!isCurrent && (
                  <button
                    onClick={() => choosePlan(plan)}
                    className={`w-full mt-4 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      plan.id === 'free'
                        ? 'bg-white/[0.03] hover:bg-white/[0.06] text-white/80 border border-white/10'
                        : 'bg-[#e3b553] text-[#0a0a0b] hover:bg-[#d2a442]'
                    }`}
                  >
                    {plan.id === 'free' ? 'Ücretsiz Pakete Geç' : `${plan.name} Paketine Yükselt`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Flashcard review entry */}
      <button
        onClick={onOpenCards}
        className={`w-full flex items-center justify-between rounded-2xl border p-5 transition-all cursor-pointer ${
          dueCount > 0 ? 'bg-[#e3b553]/[0.07] border-[#e3b553]/25' : 'bg-white/[0.02] border-white/[0.06]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/[0.03] text-[#e3b553] border border-[#e3b553]/20 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-serif italic text-white">Kelime Kartları</p>
            <p className="text-[11px] text-white/40 font-mono">
              {dueCount > 0 ? `Bugün ${dueCount} kart tekrar edilecek` : 'Aralıklı tekrar destesi'}
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-[#e3b553]" />
      </button>

      {/* Stats section (reuses the progress dashboard) */}
      <div>
        <h2 className="text-sm font-serif italic text-white flex items-center gap-2 mb-3 px-1">
          İstatistikler
        </h2>
        <ProgressScreen
          gamification={gamification}
          srsState={srsState}
          grammarProgress={grammarProgress}
          quizStats={quizStats}
          hideHeader
        />
      </div>

      {/* Settings */}
      <button
        onClick={onResetStats}
        className="w-full flex items-center justify-center gap-2 text-xs font-mono text-white/30 hover:text-red-400 transition-colors py-3 cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Tüm istatistikleri sıfırla
      </button>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed left-1/2 -translate-x-1/2 z-50 bg-[#171412] border border-[#e3b553]/30 text-white text-xs rounded-xl px-4 py-3 shadow-lg max-w-[90%] text-center"
            style={{ bottom: 'calc(var(--bottom-nav-h, 66px) + 16px)' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
