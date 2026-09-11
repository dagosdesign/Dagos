import { Check } from 'lucide-react';
import { MembershipPlan } from '../../lib/plan';
import { C, Card, GhostButton, GoldButton, SectionHeading } from './ui';

const FREE_FEATURES = [
  '10 Words / Day',
  '3 Games / Day',
  '1 Grammar Activity / Day',
  '1 Listening Activity / Day',
  'Basic Progress Tracking',
  'Daily Challenge',
];

const PREMIUM_FEATURES = [
  'Unlimited Vocabulary',
  'Unlimited Games',
  'Full Grammar Access',
  'Listening',
  'Speaking',
  'Writing',
  'AI Coach',
  'Personal Learning Plan',
  'Detailed Progress Analytics',
  'Weakness Analysis',
  'Smart Recommendations',
  'Unlimited Check Your Level Retakes',
];

/* FREE is daily learning, PREMIUM is unlimited learning plus AI personalisation.
   Tapping Free as a Premium member never downgrades on the spot: it opens
   subscription management. */
export default function MembershipSection({
  plan,
  onUpgrade,
  onManage,
}: {
  plan: MembershipPlan;
  onUpgrade: () => void;
  onManage: () => void;
}) {
  const freeCurrent = plan === 'free';
  const premiumCurrent = plan === 'premium';

  return (
    <section className="space-y-4">
      <SectionHeading title="Membership Plan" subtitle="Choose the plan that works for you." />
      <div className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-3">
        {/* FREE */}
        <div
          className="rounded-[22px] border p-5 flex flex-col"
          style={{ background: C.card, borderColor: freeCurrent ? 'rgba(255,255,255,0.32)' : C.border }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[18px] font-semibold" style={{ color: C.text }}>
                Free
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>
                Basic Access
              </p>
            </div>
            {freeCurrent && (
              <span className="text-[10.5px] font-semibold tracking-[0.12em] rounded-full px-2.5 py-1" style={{ background: C.text, color: '#0B0B0B' }}>
                CURRENT
              </span>
            )}
          </div>
          <p className="text-[12px] mt-3 tracking-[0.08em] uppercase" style={{ color: C.muted }}>
            Daily Learning
          </p>
          <FeatureList items={FREE_FEATURES} tone="free" />
          <div className="mt-auto pt-2">
            {freeCurrent ? (
              <GhostButton disabled>Current Plan</GhostButton>
            ) : (
              <GhostButton onClick={onManage}>Manage Plan</GhostButton>
            )}
          </div>
        </div>

        {/* PREMIUM */}
        <Card gold glow className="p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[18px] font-semibold" style={{ color: C.gold }}>
                Premium
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>
                Unlimited Learning
              </p>
            </div>
            {premiumCurrent && (
              <span
                className="text-[10.5px] font-semibold tracking-[0.12em] rounded-full px-2.5 py-1 whitespace-nowrap"
                style={{ background: C.gold, color: '#0B0B0B' }}
              >
                PREMIUM ACTIVE
              </span>
            )}
          </div>
          <p className="text-[12px] mt-3 tracking-[0.08em] uppercase" style={{ color: C.gold }}>
            Unlimited Learning + AI Personalization
          </p>
          <FeatureList items={PREMIUM_FEATURES} tone="premium" />
          <div className="mt-auto pt-2">
            {premiumCurrent ? (
              <GhostButton disabled>Current Plan</GhostButton>
            ) : (
              <GoldButton onClick={onUpgrade}>Upgrade to Premium</GoldButton>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

function FeatureList({ items, tone }: { items: string[]; tone: 'free' | 'premium' }) {
  return (
    <ul className="mt-3 mb-4 space-y-2">
      {items.map(item => (
        <li key={item} className="flex items-start gap-2.5 text-[14px] leading-snug" style={{ color: C.text }}>
          <Check
            className="w-4 h-4 mt-[2px] shrink-0"
            strokeWidth={2.4}
            color={tone === 'premium' ? C.gold : C.muted}
          />
          <span className="break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}
