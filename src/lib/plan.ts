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

export function featuresFor(plan: MembershipPlan): PlanFeatures {
  return plan === 'premium' ? PREMIUM_PLAN : FREE_PLAN;
}

/* How many are left today, or Infinity for an unlimited allowance. */
export function remaining(limit: number | 'unlimited', used: number): number {
  return limit === 'unlimited' ? Infinity : Math.max(0, limit - used);
}
