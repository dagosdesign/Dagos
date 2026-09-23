/* Membership plans. FREE is daily learning; PREMIUM is unlimited learning plus
   AI personalisation. Every limit in the app reads from here. */

export type MembershipPlan = 'free' | 'premium';

export interface PlanFeatures {
  wordsPerDay: number | 'unlimited';
  gamesPerDay: number | 'unlimited';
  grammarActivitiesPerDay: number | 'unlimited';
  listeningActivitiesPerDay: number | 'unlimited';

  aiCoach: boolean;
  personalLearningPlan: boolean;
  advancedAnalytics: boolean;
  weaknessAnalysis: boolean;
  smartRecommendations: boolean;
  placementRetakes: boolean;
}

export const FREE_PLAN: PlanFeatures = {
  wordsPerDay: 10,
  gamesPerDay: 3,
  grammarActivitiesPerDay: 1,
  listeningActivitiesPerDay: 1,

  aiCoach: false,
  personalLearningPlan: false,
  advancedAnalytics: false,
  weaknessAnalysis: false,
  smartRecommendations: false,
  placementRetakes: false,
};

export const PREMIUM_PLAN: PlanFeatures = {
  wordsPerDay: 'unlimited',
  gamesPerDay: 'unlimited',
  grammarActivitiesPerDay: 'unlimited',
  listeningActivitiesPerDay: 'unlimited',

  aiCoach: true,
  personalLearningPlan: true,
  advancedAnalytics: true,
  weaknessAnalysis: true,
  smartRecommendations: true,
  placementRetakes: true,
};

/* What the Premium card promises, and its price - one place for every screen.
   The price shown here must match the subscription defined in App Store Connect
   and Google Play (phase 3); the stores, not the app, charge it. */
export const PREMIUM_PRICE = { amount: 999, currency: 'TRY', symbol: '₺', period: 'year' as 'month' | 'year' };
export const PREMIUM_PRICE_LABEL = `${PREMIUM_PRICE.symbol}${PREMIUM_PRICE.amount}`;
export const PREMIUM_PERIOD_LABEL = PREMIUM_PRICE.period === 'month' ? '/ month' : '/ year';
export const PREMIUM_TAGLINE = 'Unlimited Learning + AI Personalization';
export const PREMIUM_FEATURES = [
  'Unlimited AI LEX',
  'Personalized Learning',
  'General English',
  'LGS · YDT · YDS · YÖKDİL · IELTS',
  'Grammar Mastery + Tests',
  'Unlimited Vocabulary',
  'Unlimited Games',
  'Unlimited Speaking',
  'Unlimited Listening',
  'Unlimited Writing',
  'Personalized Stories',
  'Personalized Conversations',
  'Visual Learning',
  'Wordrobe',
  'Check Your Level Anytime',
  'Performance Analysis',
  'Weekly Summary',
  'Streak Reminders',
  'Continuous Updates',
];

export function featuresFor(plan: MembershipPlan): PlanFeatures {
  return plan === 'premium' ? PREMIUM_PLAN : FREE_PLAN;
}

/* How many are left today, or Infinity for an unlimited allowance. */
export function remaining(limit: number | 'unlimited', used: number): number {
  return limit === 'unlimited' ? Infinity : Math.max(0, limit - used);
}
