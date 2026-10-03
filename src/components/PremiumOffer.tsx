import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { C, Card, GhostButton, GoldButton } from './profile/ui';
import { useAuth } from '../lib/auth';
import { API_BASE, isNative, platform } from '../lib/runtime';
import { billingAvailable, BillingError, buyPremium, loadOffer, restorePremium, type PremiumOffer as Offer } from '../lib/billing';
import { PREMIUM_FEATURES, PREMIUM_PERIOD_LABEL, PREMIUM_PRICE_LABEL, PREMIUM_TAGLINE } from '../lib/plan';

/* The Premium offer with its Buy button - the one place the app sells Premium
   (Subscription page and the daily-limit card both show it).

   What the stores require on a subscription screen is all here: the price as the
   store charges it, the length of the period, that it renews automatically and how
   to cancel, Restore Purchases, and links to the Terms and the Privacy Policy. */

const openPage = (path: string) => {
  const url = `${API_BASE || window.location.origin}${path}`;
  if (isNative) void Browser.open({ url });
  else window.open(url, '_blank', 'noopener');
};

export default function PremiumOffer({
  onActivated,
  onSignIn,
  showFeatures = true,
}: {
  onActivated?: () => void;
  onSignIn?: () => void;
  showFeatures?: boolean;
}) {
  const auth = useAuth();
  const signedIn = Boolean(auth.session);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: 'info' | 'error' } | null>(null);

  // The price comes from the store, in the student's own currency.
  useEffect(() => {
    if (!billingAvailable || !signedIn) return;
    let live = true;
    loadOffer()
      .then(o => live && setOffer(o))
      .catch(err => live && setMessage({ text: err instanceof BillingError ? err.message : 'Premium could not be loaded.', tone: 'error' }));
    return () => {
      live = false;
    };
  }, [signedIn]);

  const price = offer?.price ?? PREMIUM_PRICE_LABEL;
  const period = offer ? (offer.period === 'month' ? '/ month' : offer.period === 'year' ? '/ year' : '') : PREMIUM_PERIOD_LABEL;
  const periodWord = (offer?.period ?? 'year') === 'month' ? 'month' : 'year';

  const run = async (kind: 'buy' | 'restore') => {
    setBusy(kind);
    setMessage(null);
    try {
      if (kind === 'buy') {
        if (!offer) throw new BillingError('no_offer', 'Premium is not available in the store right now. Please try again later.');
        await buyPremium(offer);
        onActivated?.();
      } else if (await restorePremium()) {
        onActivated?.();
      } else {
        setMessage({ text: 'No active Premium subscription was found for this store account.', tone: 'info' });
      }
    } catch (err) {
      if (err instanceof BillingError && err.code === 'cancelled') return;
      setMessage({
        text: err instanceof BillingError ? err.message : 'Something went wrong. Please try again.',
        tone: err instanceof BillingError && err.code === 'pending' ? 'info' : 'error',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card gold glow className="p-5 space-y-3">
      <p className="text-[12px] tracking-[0.12em] font-semibold" style={{ color: C.gold }}>
        PREMIUM
      </p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[30px] font-bold leading-none" style={{ color: C.text }}>
          {price}
        </span>
        <span className="text-[13px]" style={{ color: C.muted }}>
          {period}
        </span>
      </div>
      <p className="text-[14px] font-medium" style={{ color: C.text }}>
        {PREMIUM_TAGLINE}
      </p>

      {showFeatures && (
        <ul className="space-y-2 pt-1">
          {PREMIUM_FEATURES.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-[14px]" style={{ color: C.text }}>
              <Check className="w-4 h-4 mt-[2px] shrink-0" color={C.gold} strokeWidth={2.4} />
              {f}
            </li>
          ))}
        </ul>
      )}

      {!billingAvailable ? (
        <p className="text-[13px] leading-relaxed pt-1" style={{ color: C.gold }}>
          Premium is available in the Lexistencehub app on Google Play and the App Store.
        </p>
      ) : !signedIn ? (
        <>
          <p className="text-[13px] leading-relaxed pt-1" style={{ color: C.muted }}>
            Sign in first, so Premium is saved to your account and works on all your devices.
          </p>
          {onSignIn ? (
            <GoldButton onClick={onSignIn}>Sign in to continue</GoldButton>
          ) : (
            <p className="text-[13px]" style={{ color: C.gold }}>
              Sign in from Profile, then come back here.
            </p>
          )}
        </>
      ) : (
        <>
          <GoldButton onClick={() => void run('buy')} disabled={busy !== null || !offer}>
            {busy === 'buy' ? 'Processing…' : !offer && !message ? 'Loading…' : 'Upgrade to Premium'}
          </GoldButton>
          <GhostButton onClick={() => void run('restore')} disabled={busy !== null}>
            {busy === 'restore' ? 'Restoring…' : 'Restore Purchases'}
          </GhostButton>
        </>
      )}

      {message && (
        <p className="text-[13px] leading-relaxed text-center" style={{ color: message.tone === 'error' ? '#E5896F' : C.gold }}>
          {message.text}
        </p>
      )}

      <p className="text-[11.5px] leading-relaxed pt-1" style={{ color: C.muted }}>
        Premium is a subscription of {price} per {periodWord}, charged to your {platform === 'ios' ? 'Apple ID' : 'Google Play account'}. It renews
        automatically unless you cancel at least 24 hours before the end of the period; you can cancel any time in
        your store account's subscription settings.{' '}
        <button type="button" onClick={() => openPage('/terms')} className="underline cursor-pointer" style={{ color: C.text }}>
          Terms of Use
        </button>{' '}
        ·{' '}
        <button type="button" onClick={() => openPage('/privacy')} className="underline cursor-pointer" style={{ color: C.text }}>
          Privacy Policy
        </button>
      </p>
    </Card>
  );
}
