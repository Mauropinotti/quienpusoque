import type { SplitBasis } from "./family";

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
  /** La recomendación elige la base; cuánto pagan los menores lo decide el grupo. */
  recommendedMode: SplitBasis;
  confidence: RecommendationConfidence;
  reasons: string[];
  metrics: RecommendationMetrics;
}
