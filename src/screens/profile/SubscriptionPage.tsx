import { useState } from 'react';
import { Check } from 'lucide-react';
import { C, Card, GhostButton, GoldButton, SubPage } from '../../components/profile/ui';
import { setMembership, useUserProfile } from '../../lib/userProfile';

const LOSES = [
  'Unlimited vocabulary, games, grammar and listening',
  'AI Coach and your personal learning plan',
  'Detailed analytics, weakness analysis and smart recommendations',
  'Unlimited Check Your Level retakes',
];

/* Subscription management. A Premium member only moves to Free after
   confirming here - never by tapping the Free card. */
export default function SubscriptionPage({ onBack, notify }: { onBack: () => void; notify: (msg: string) => void }) {
  const profile = useUserProfile();
  const [confirming, setConfirming] = useState(false);

  if (profile.membership === 'free') {
    return (
      <SubPage title="Subscription" subtitle="Free plan" onBack={onBack}>
        <Card className="p-5 space-y-3">
          <p className="text-[17px] font-semibold" style={{ color: C.text }}>
            You are on the Free plan
          </p>
          <p className="text-[14px]" style={{ color: C.muted }}>
            Daily learning with 10 words, 3 games, 1 grammar and 1 listening activity every day.
          </p>
          <GoldButton
            onClick={() => {
              setMembership('premium');
              notify('Premium is now active');
              onBack();
            }}
          >
            Upgrade to Premium
          </GoldButton>
        </Card>
      </SubPage>
    );
  }

  return (
    <SubPage title="Subscription" subtitle="Premium active" onBack={onBack}>
      <Card gold glow className="p-5 space-y-2">
        <p className="text-[12px] tracking-[0.12em] font-semibold" style={{ color: C.gold }}>
          PREMIUM ACTIVE
        </p>
        <p className="text-[17px] font-semibold" style={{ color: C.text }}>
          Unlimited Learning + AI Personalization
        </p>
      </Card>

      <Card className="p-5 space-y-3">
        <p className="text-[17px] font-semibold" style={{ color: C.text }}>
          Switching to Free
        </p>
        <p className="text-[14px]" style={{ color: C.muted }}>
          On the Free plan you keep your progress, level and history, but these Premium features stop:
        </p>
        <ul className="space-y-2">
          {LOSES.map(l => (
            <li key={l} className="flex items-start gap-2.5 text-[14px]" style={{ color: C.text }}>
              <Check className="w-4 h-4 mt-[2px] shrink-0" color={C.muted} strokeWidth={2.4} />
              {l}
            </li>
          ))}
        </ul>
      </Card>

      <GoldButton onClick={onBack}>Keep Premium</GoldButton>
      {confirming ? (
        <Card className="p-4 space-y-3">
          <p className="text-[14px] text-center" style={{ color: C.text }}>
            Switch to the Free plan now?
          </p>
          <div className="flex gap-2">
            <GhostButton onClick={() => setConfirming(false)}>Cancel</GhostButton>
            <GhostButton
              onClick={() => {
                setMembership('free');
                notify('You are now on the Free plan');
                onBack();
              }}
            >
              Yes, switch
            </GhostButton>
          </div>
        </Card>
      ) : (
        <GhostButton onClick={() => setConfirming(true)}>Switch to Free</GhostButton>
      )}
    </SubPage>
  );
}
