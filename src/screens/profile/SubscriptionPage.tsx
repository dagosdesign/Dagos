import { useState } from 'react';
import { Check } from 'lucide-react';
import { C, Card, GhostButton, GoldButton, SubPage } from '../../components/profile/ui';
import { setMembership, useUserProfile } from '../../lib/userProfile';
import { PREMIUM_FEATURES, PREMIUM_PERIOD_LABEL, PREMIUM_PRICE_LABEL, PREMIUM_TAGLINE } from '../../lib/plan';

const LOSES = PREMIUM_FEATURES;

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
        </Card>
        <Card gold glow className="p-5 space-y-3">
          <p className="text-[12px] tracking-[0.12em] font-semibold" style={{ color: C.gold }}>
            PREMIUM
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[30px] font-bold leading-none" style={{ color: C.text }}>
              {PREMIUM_PRICE_LABEL}
            </span>
            <span className="text-[13px]" style={{ color: C.muted }}>
              {PREMIUM_PERIOD_LABEL}
            </span>
          </div>
          <p className="text-[14px] font-medium" style={{ color: C.text }}>
            {PREMIUM_TAGLINE}
          </p>
          <ul className="space-y-2 pt-1">
            {PREMIUM_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-[14px]" style={{ color: C.text }}>
                <Check className="w-4 h-4 mt-[2px] shrink-0" color={C.gold} strokeWidth={2.4} />
                {f}
              </li>
            ))}
          </ul>
          <GoldButton
            onClick={() => {
              notify(setMembership('premium') ? 'Premium is now active' : 'Premium purchases open with the App Store and Google Play release');
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
          {PREMIUM_TAGLINE}
        </p>
        <p className="text-[13px]" style={{ color: C.muted }}>
          {PREMIUM_PRICE_LABEL} {PREMIUM_PERIOD_LABEL}
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
                notify(setMembership('free') ? 'You are now on the Free plan' : 'Subscriptions are managed in the App Store or Google Play');
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
