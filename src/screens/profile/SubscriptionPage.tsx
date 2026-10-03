import { Check } from 'lucide-react';
import { C, Card, GhostButton, GoldButton, SubPage } from '../../components/profile/ui';
import PremiumOffer from '../../components/PremiumOffer';
import { useAuth } from '../../lib/auth';
import { billingAvailable, openManageSubscription } from '../../lib/billing';
import { useUserProfile } from '../../lib/userProfile';
import { PREMIUM_FEATURES, PREMIUM_TAGLINE } from '../../lib/plan';

const renewalDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

/* Subscription: the Premium offer on Free; on Premium, the renewal date and the way
   to the store's subscription settings - cancelling happens there, not in the app. */
export default function SubscriptionPage({
  onBack,
  notify,
  onSignIn,
}: {
  onBack: () => void;
  notify: (msg: string) => void;
  onSignIn?: () => void;
}) {
  const profile = useUserProfile();
  const auth = useAuth();

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
        <PremiumOffer
          onSignIn={onSignIn}
          onActivated={() => {
            notify('Premium is now active');
            onBack();
          }}
        />
      </SubPage>
    );
  }

  const renews = renewalDate(auth.planExpiresAt);
  return (
    <SubPage title="Subscription" subtitle="Premium active" onBack={onBack}>
      <Card gold glow className="p-5 space-y-2">
        <p className="text-[12px] tracking-[0.12em] font-semibold" style={{ color: C.gold }}>
          PREMIUM ACTIVE
        </p>
        <p className="text-[17px] font-semibold" style={{ color: C.text }}>
          {PREMIUM_TAGLINE}
        </p>
        {renews && (
          <p className="text-[13px]" style={{ color: C.muted }}>
            Renews or ends on {renews}
          </p>
        )}
      </Card>

      <Card className="p-5 space-y-3">
        <p className="text-[15px] font-semibold" style={{ color: C.text }}>
          Included in your plan
        </p>
        <ul className="space-y-2">
          {PREMIUM_FEATURES.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-[14px]" style={{ color: C.text }}>
              <Check className="w-4 h-4 mt-[2px] shrink-0" color={C.gold} strokeWidth={2.4} />
              {f}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5 space-y-2">
        <p className="text-[15px] font-semibold" style={{ color: C.text }}>
          Cancelling
        </p>
        <p className="text-[13.5px] leading-relaxed" style={{ color: C.muted }}>
          Your subscription is managed by {billingAvailable ? 'the store you bought it from' : 'Google Play or the App Store'}.
          If you cancel, Premium stays active until the end of the period you paid for; your progress, level and history
          always stay.
        </p>
      </Card>

      <GoldButton onClick={onBack}>Keep Premium</GoldButton>
      <GhostButton onClick={() => void openManageSubscription()}>Manage Subscription</GhostButton>
    </SubPage>
  );
}
