export type AnchorType = 'Course' | 'Module' | 'Subtopic' | 'Semantic'
export type ApplicationContextSource = 'EDUCATOR_ENTERED' | 'ACCEPTED_SYSTEM_GENERATED'
export type DecisionStatus = 'RECOMMENDED_HYBRID_EVIDENCE' | 'ABSTAIN_NO_SUSTAINABILITY_MECHANISM' | 'ABSTAIN_SCOPE_MISMATCH_REANCHOR' | 'ABSTAIN_INSUFFICIENT_EVIDENCE'
export type UserRole = 'EDUCATOR' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'INACTIVE'

export interface Course { course_id: string; title: string; domain: string; discipline: string; description: string; objectives: string; learning_outcomes: string; course_type: string; level: string; status: string }
export interface Module { module_id: string; name: string; module_no: string; description: string; module_sd_id: string; status: string }
export interface Subtopic { subtopic_id: string; name: string; subtopic_no: string; description: string; subtopic_sd_id: string; review_status: string; status: string; version: string }
export interface KCR { kcr_id: string; name: string; domain: string; concept_category: string; concept_type: string; definition: string; scope: string; core_principles: string; semantic_description: string; keywords_synonyms: string; status: string }
export interface KPR { kpr_id: string; name: string; domain: string; discipline: string; principle_type: string; principle_granularity: string; definition: string; scope: string; core_ideas: string; semantic_description: string; keywords_synonyms: string; status: string }
export interface KFR { kfr_id: string; name: string; domain: string; discipline: string; function_type: string; function_granularity: string; definition: string; scope: string; purpose: string; inputs: string; outputs: string; realization_or_mechanism: string; semantic_description: string; keywords_synonyms: string; status: string }
export interface SCR { scr_id: string; name: string; sustainability_dimension: string; domain: string; definition: string; scope: string; core_ideas: string; semantic_description: string; keywords_synonyms: string; sustainability_principle: string; principle_origin: string; underlying_mechanism: string; derived_from_practice_or_system: string; evidence_status: string; implementation_maturity: string; transferability: string; boundary_conditions: string; recommendation_trigger: string; status: string }
export interface Guardrail { guardrail_id: string; guardrail_level: string; topic: string; allowed_concepts: string; excluded_claims: string; evidence_type: string; status: string }
export interface ApplicationContext { application_context_id: string; name: string; context_granularity: string; application_domain: string; description: string; technical_problem: string; operational_action: string; mechanism: string; sustainability_outcome: string; boundary_conditions: string; relevant_disciplines: string; transferability: string; keywords_synonyms: string; status: string; context_source: string }
export interface SDGGoal { sdg_goal_id: string; goal_number: string; title: string; description: string; status: string }
export interface SDGTarget { sdg_target_id: string; target_code: string; text: string; status: string }
export interface SDGIndicator { sdg_indicator_id: string; indicator_code: string; text: string; status: string }
export interface ESDObjective { esd_objective_id: string; domain: string; objective_no: string; text: string; status: string }
export interface ESDCompetency { esd_competency_id: string; name: string; definition: string; scope: string; status: string }
export interface CFKnowledge { cf_knowledge_id: string; education_level: string; sub_heading: string; text: string; status: string }
export interface CFSkill { cf_skill_id: string; education_level: string; sub_heading: string; text: string; status: string }
export interface CFValue { cf_value_id: string; education_level: string; sub_heading: string; text: string; status: string }
export interface CFCompetency { cf_competency_id: string; name: string; definition: string; scope: string; status: string }
export interface Relationship { start_id: string; end_id: string; type: string }

export interface RecommendationRequest {
  test_id: string; test_dimension: string; anchor_type: AnchorType; anchor_id: string;
  course_hint: string; technical_query: string; application_context: string;
  technical_system: string; operational_action: string; mechanism: string;
  affected_resource_or_function: string; stakeholder_or_ecological_context: string;
  boundary_conditions: string; sustainability_mechanism_present: string;
  application_context_source: ApplicationContextSource; accepted_context_id: string;
  teaching_context?: TeachingContext;
}
export interface TeachingContext { class_size?: string; session_duration?: string; assessment_preference?: string; activity_format?: string; pedagogical_approach?: string }

export interface RecommendationResult {
  test_id: string; test_dimension: string; semantic_backend: string; semantic_backend_version: string;
  embedding_dimension: number; input_anchor_type: string; input_anchor_id: string; course_hint: string;
  resolution_type: string; resolution_id: string; selected_kcr_ids: string; evidence_node_ids: string;
  scope_status: string; scope_mismatch_sibling: string; scope_mismatch_sibling_score: number; direct_anchor_score: number;
  mechanism_present: string; mechanism_facets_json: string; promotion_facets_json: string;
  negative_promotion_facets_json: string; negation_vetoed_scr_ids: string;
  top_context_ids: string; top_context_scores: string;
  recommended_scr_id: string; recommended_scr_name: string; promoted_scr_ids: string;
  decision_status: string; top_candidates_json: string; semantic_anchor_top_json: string;
}

export interface TopCandidate {
  rank: number; raw_rank: number; scr_id: string; scr_name: string;
  semantic_score: number; evidence_tier: number; mechanism_facet_max: number;
  full_profile_score: number; context_evidence_score: number;
  best_promotion_facet_index: number; best_promotion_facet_score: number;
  best_promotion_facet_text: string; best_promotion_facet_lexical_match_count: number;
  best_promotion_facet_lexical_score: number; best_promotion_facet_rare_match_count: number;
  best_promotion_facet_idf_score: number; supporting_context_ids: string;
  promotion_path: string; negation_veto: string; negation_veto_facet_index: number;
  negation_veto_facet_text: string; negation_veto_reason: string; redirected_from: string;
}
