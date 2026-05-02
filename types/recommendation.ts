import type { SplitMode } from "./family";

export type RecommendationConfidence = "low" | "medium" | "high";

export interface RecommendationMetrics {
  eligibleFamilies: number;
  eligiblePersons: number;
  singleAdultFamilyRatio: number;
  largeFamilyRatio: number;
  averageFamilySize: number;
  averageImpactBetweenModes: number;
  maxImpactBetweenModes: number;
}

export interface SplitRecommendation {
  recommendedMode: SplitMode;
  confidence: RecommendationConfidence;
  reasons: string[];
  metrics: RecommendationMetrics;
}
