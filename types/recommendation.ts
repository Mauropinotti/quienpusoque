import type { SplitMode } from "./family";

export type RecommendationConfidence = "low" | "medium" | "high";

export interface RecommendationMetrics {
  totalFamilies: number;
  eligibleFamilies: number;
  totalEligiblePersons: number;
  singleAdultFamiliesRatio: number;
  largeFamiliesRatio: number;
  avgMembersPerEligibleFamily: number;
  avgImpactDiff: number;
  maxImpactDiff: number;
}

export interface SplitRecommendation {
  recommendedMode: SplitMode;
  confidence: RecommendationConfidence;
  reasons: string[];
  metrics: RecommendationMetrics;
}
