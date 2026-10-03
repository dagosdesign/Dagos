import { Purchases, type PurchasesPackage } from '@revenuecat/purchases-capacitor';
import { Browser } from '@capacitor/browser';
import { isNative, platform } from './runtime';
import { getAuth, refreshPlan } from './auth';
import { apiFetch } from './api';

/* PREMIUM PURCHASES in the app (Google Play / App Store through RevenueCat).

   The store takes the payment, RevenueCat confirms it, the server writes Premium into
   the account (billing.ts on the server) and the app reads it from there - this file
   never switches Premium on by itself. Purchases need a signed-in account: the
   RevenueCat user is the Supabase user, so Premium follows the account to every device.
   On the web there is nothing to buy: Premium is sold only inside the store apps. */

const API_KEY = platform === 'android'
  ? import.meta.env.VITE_REVENUECAT_ANDROID_KEY
  : platform === 'ios'
    ? import.meta.env.VITE_REVENUECAT_IOS_KEY
    : undefined;

/* Whether this build can sell Premium at all. */
export const billingAvailable = isNative && Boolean(API_KEY);

let configuredFor: string | null = null;

/* RevenueCat, set up for the signed-in account (switching user if it changed). */
async function ready(): Promise<string> {
  const userId = getAuth().session?.user.id;
  if (!userId) throw new BillingError('sign_in', 'Please sign in to buy Premium, so it stays with your account.');
  if (!billingAvailable) throw new BillingError('unavailable', 'Premium can be bought in the Lexistencehub app on Google Play or the App Store.');
  if (configuredFor === null) {
    await Purchases.configure({ apiKey: API_KEY!, appUserID: userId });
  } else if (configuredFor !== userId) {
    await Purchases.logIn({ appUserID: userId });
  }
  configuredFor = userId;
  return userId;
}

export class BillingError extends Error {
  constructor(public code: 'sign_in' | 'unavailable' | 'no_offer' | 'cancelled' | 'pending' | 'failed', message: string) {
    super(message);
  }
}

export interface PremiumOffer {
  pkg: PurchasesPackage;
  price: string; // in the store's currency and format, e.g. "₺999,99"
  period: 'year' | 'month' | 'other';
}

/* The Premium package as the store sells it (the current offering in RevenueCat). */
export async function loadOffer(): Promise<PremiumOffer> {
  await ready();
  const { current } = await Purchases.getOfferings();
  const pkg = current?.annual ?? current?.monthly ?? current?.availablePackages[0];
  if (!pkg) throw new BillingError('no_offer', 'Premium is not available in the store right now. Please try again later.');
  const type = String(pkg.packageType);
  const period = type === 'ANNUAL' ? 'year' : type === 'MONTHLY' ? 'month' : 'other';
  return { pkg, price: pkg.product.priceString, period };
}

/* Asks the server to read the purchase from RevenueCat and write it to the account,
   then reloads the plan. Retried a few times: the store can take a moment. */
async function confirmWithServer(): Promise<boolean> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await apiFetch('/api/billing/sync', { method: 'POST' });
      if (res.ok) {
        const { plan } = (await res.json()) as { plan: 'free' | 'premium' };
        await refreshPlan();
        if (plan === 'premium') return true;
      }
    } catch {
      /* network: try again */
    }
    await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
  }
  await refreshPlan();
  return getAuth().plan === 'premium';
}

/* Buys Premium. Resolves when Premium is active on the account. */
export async function buyPremium(offer: PremiumOffer): Promise<void> {
  await ready();
  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: offer.pkg });
    const bought = Object.keys(customerInfo.entitlements.active).length > 0;
    if (!bought) {
      // e.g. a card payment that the bank still has to approve
      throw new BillingError('pending', 'Your payment is being processed. Premium opens as soon as the store confirms it.');
    }
  } catch (err: any) {
    if (err instanceof BillingError) throw err;
    // RevenueCat error codes: "1" cancelled by the user, "20" payment pending
    if (err?.userCancelled || String(err?.code) === '1') throw new BillingError('cancelled', 'Purchase cancelled.');
    if (String(err?.code) === '20') {
      throw new BillingError('pending', 'Your payment is being processed. Premium opens as soon as the store confirms it.');
    }
    throw new BillingError('failed', 'The purchase could not be completed. You have not been charged; please try again.');
  }
  if (!(await confirmWithServer())) {
    throw new BillingError('pending', 'Your purchase went through. Premium opens in a moment; if not, tap Restore Purchases.');
  }
}

/* Restore Purchases: brings back a subscription bought earlier with this store account. */
export async function restorePremium(): Promise<boolean> {
  await ready();
  try {
    await Purchases.restorePurchases();
  } catch {
    throw new BillingError('failed', 'Purchases could not be restored. Please check your connection and try again.');
  }
  return confirmWithServer();
}

/* Cancelling and changing the plan happen in the store's own subscription page. */
export async function openManageSubscription(): Promise<void> {
  let url: string | null = null;
  if (billingAvailable && getAuth().session) {
    try {
      await ready();
      url = (await Purchases.getCustomerInfo()).customerInfo.managementURL;
    } catch {
      /* fall back to the store page */
    }
  }
  url ??= platform === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions?package=app.lexistencehub';
  await Browser.open({ url });
}
