export interface RuntimeConfig {
  semantic_backend: string; model_name: string;
  semantic_anchor_top_k: number; technical_scope_top_k: number;
  scr_candidate_top_k: number; context_top_k: number;
  subtopic_scope_mismatch_margin: number; subtopic_scope_mismatch_min_sibling: number;
  strong_context_threshold: number; moderate_context_threshold: number;
  min_context_supported_mechanism_score: number;
  mechanism_weight: number; full_profile_weight: number; context_evidence_weight: number;
  promotion_min_evidence_tier: number; promotion_min_mechanism_score: number;
  promotion_score_margin: number; promotion_max: number;
  promotion_candidate_pool: number; promotion_facet_local_top_k: number;
  promotion_independent_min_facet_score: number; promotion_independent_context_floor: number;
  promotion_specific_rare_df_ratio: number; promotion_specific_min_idf_score: number;
  promotion_independent_facet_advantage: number; promotion_independent_facet_ratio_over_primary: number;
  promotion_independent_weighted_ratio: number; promotion_independent_score_margin: number;
  negation_veto_min_semantic: number; negation_veto_min_idf_score: number; negation_veto_min_rare_matches: number;
}

export const FROZEN_CONFIG: RuntimeConfig = {
  semantic_backend: 'lsa', model_name: 'sentence-transformers/all-MiniLM-L6-v2',
  semantic_anchor_top_k: 10, technical_scope_top_k: 5, scr_candidate_top_k: 5, context_top_k: 5,
  subtopic_scope_mismatch_margin: 0.12, subtopic_scope_mismatch_min_sibling: 0.45,
  strong_context_threshold: 0.62, moderate_context_threshold: 0.44, min_context_supported_mechanism_score: 0.22,
  mechanism_weight: 0.55, full_profile_weight: 0.35, context_evidence_weight: 0.10,
  promotion_min_evidence_tier: 2, promotion_min_mechanism_score: 0.28, promotion_score_margin: 0.16, promotion_max: 3,
  promotion_candidate_pool: 10, promotion_facet_local_top_k: 12,
  promotion_independent_min_facet_score: 0.26, promotion_independent_context_floor: 0.40,
  promotion_specific_rare_df_ratio: 0.18, promotion_specific_min_idf_score: 0.075,
  promotion_independent_facet_advantage: 0.025, promotion_independent_facet_ratio_over_primary: 1.08,
  promotion_independent_weighted_ratio: 0.52, promotion_independent_score_margin: 0.34,
  negation_veto_min_semantic: 0.30, negation_veto_min_idf_score: 0.10, negation_veto_min_rare_matches: 1,
}

export const REPOSITORY_VERSION = 'design8a-v5a-frozen-v1'
