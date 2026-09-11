import { Crown } from 'lucide-react';
import { setMembership } from '../lib/userProfile';
import { C, GhostButton, GoldButton } from './profile/ui';

export type LimitKind = 'games' | 'words' | 'grammar' | 'listening' | 'ai' | 'analytics' | 'retake';

const COPY: Record<LimitKind, { title: string; body: string }> = {
  games: {
    title: 'Today’s 3 free games are done',
    body: 'New games unlock tomorrow. Premium gives you unlimited games every day.',
  },
  words: {
    title: 'Today’s 10 free words are done',
    body: 'You can keep practising the words you studied today. Premium unlocks unlimited vocabulary.',
  },
  grammar: {
    title: 'Today’s free grammar activity is done',
    body: 'You can retry the test you started today. Premium gives you full grammar access.',
  },
  listening: {
    title: 'Today’s free listening activity is done',
    body: 'A new listening activity unlocks tomorrow. Premium makes listening unlimited.',
  },
  ai: {
    title: 'AI Coach is part of Premium',
    body: 'Premium unlocks AI Lex conversations, a personal learning plan and smart recommendations.',
  },
  analytics: {
    title: 'Detailed analytics are part of Premium',
    body: 'Premium adds detailed progress analytics, weakness analysis and smart recommendations.',
  },
  retake: {
    title: 'Retaking the level test is part of Premium',
    body: 'Your first level test is free. Premium lets you check your level again as often as you like.',
  },
};

/* Shown when a Free daily limit is reached or a Premium feature is opened. The
   upgrade takes effect at once. */
export default function PlanLimitCard({
  kind,
  onBack,
  onUpgraded,
  fullScreen = false,
}: {
  kind: LimitKind;
  onBack?: () => void;
  onUpgraded?: () => void;
  fullScreen?: boolean;
}) {
  const copy = COPY[kind];
  const card = (
    <div
      className="w-full max-w-md mx-auto rounded-[22px] border p-6 text-center space-y-4"
      style={{ background: C.card, borderColor: 'rgba(245,184,46,0.45)', boxShadow: C.goldGlow }}
    >
      <span
        className="mx-auto w-14 h-14 rounded-full border flex items-center justify-center"
        style={{ borderColor: 'rgba(245,184,46,0.55)' }}
      >
        <Crown className="w-6 h-6" color={C.gold} fill={C.gold} strokeWidth={1.5} />
      </span>
      <div className="space-y-2">
        <p className="text-[19px] font-semibold leading-snug" style={{ color: C.text }}>
          {copy.title}
        </p>
        <p className="text-[14px] leading-relaxed" style={{ color: C.muted }}>
          {copy.body}
        </p>
      </div>
      <div className="space-y-2 pt-1">
        <GoldButton
          onClick={() => {
            setMembership('premium');
            onUpgraded?.();
          }}
        >
          Upgrade to Premium
        </GoldButton>
        {onBack && <GhostButton onClick={onBack}>Back</GhostButton>}
      </div>
    </div>
  );

  if (!fullScreen) return card;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5" style={{ background: C.bg }}>
      {card}
    </div>
  );
}
