import type { RuntimeConfig } from './config'
import { FROZEN_CONFIG } from './config'
import type { RepositoryData } from './repository'
import { GraphEngine } from './graph'
import type { EmbeddingBackend } from './semantic'
import { LSAEmbeddingBackend } from './semantic'
import type { RecommendationRequest, RecommendationResult, TopCandidate } from '../types/domain'

const STOP_WORDS_LEXICAL = new Set(['the','a','an','and','or','of','to','in','on','for','with','by','from','as','at','that','this','these','those','is','are','was','were','be','been','being','can','could','should','would','may','might','must','will','when','where','using','used','use','uses','into','over','under','before','after','through','across','than','rather','only','also','their','system','systems','sustainability','sustainable','decision','decisions','action','actions','outcome','outcomes','application','relevant','material','materials','process','processes','management','context','criteria'])

const PROMOTION_ACTION_WORDS = new Set(['adapt','adjust','align','allocate','analyse','analyze','assess','assign','avoid','build','compare','contribute','coordinate','correct','define','design','document','evaluate','extend','fund','give','guide','identify','improve','incorporate','increase','influence','invite','maintain','manage','map','monitor','prevent','protect','publish','recover','reduce','require','restore','review','revise','select','shift','support','target','track','transfer','use','verify','hold','receive','explain','include'])

interface RankedEntry {
  sid: string; raw_sid: string; evidence_tier: number; weighted_score: number
  mechanism_max: number; full_score: number; context_score: number
  promotion_facet_scores: number[]; promotion_lexical: [number, number, number, number, string[]][]
  negative_facet_scores: number[]; negative_lexical: [number, number, number, number, string[]][]
  negation_veto: boolean; negation_veto_index: number; negation_veto_reason: string
  supporting_contexts: [string, number][]
}

export class Design8aRuntime {
  private cfg: RuntimeConfig
  private repo: RepositoryData
  private graph: GraphEngine
  private backend: EmbeddingBackend
  private promotionTokenDf = new Map<string, number>()
  private promotionTokenSets = new Map<string, Set<string>>()
  private promotionTokenDocs = 1

  constructor(repo: RepositoryData, backend?: EmbeddingBackend) {
    this.cfg = FROZEN_CONFIG; this.repo = repo; this.graph = new GraphEngine(repo)
    this.backend = backend || new LSAEmbeddingBackend(repo.texts)
    for (const sid of this.repo.activeScrIds) {
      const toks = this.lexicalTokens(this.promotionCanonicalText(sid))
      this.promotionTokenSets.set(sid, toks)
      for (const tok of toks) this.promotionTokenDf.set(tok, (this.promotionTokenDf.get(tok) || 0) + 1)
    }
    this.promotionTokenDocs = Math.max(1, this.repo.activeScrIds.length)
  }

  getBackendInfo() { return { name: this.backend.name, version: this.backend.version, dimension: this.backend.dimension } }

  predict(req: RecommendationRequest): RecommendationResult {
    const at = req.anchor_type; const aid = req.anchor_id
    let scopeFlag = 'OK'; let semanticRank: [string, number][] = []
    let resolutionType: string; let resolutionId: string; let selectedKcrs: string[]

    if (at === 'Semantic') {
      const result = this.semanticResolve(req)
      resolutionType = result.type; resolutionId = result.id; selectedKcrs = result.kcrs; semanticRank = result.ranked
    } else {
      resolutionType = at; resolutionId = aid
      const allK = this.graph.scopeKCRs(at, aid)
      if ((at === 'Module' || at === 'Course') && allK.length > 0) {
        const q = `${req.technical_query} ${req.application_context}`.trim()
        const sc = this.backend.similarity(q, allK)
        selectedKcrs = Array.from(sc.entries()).sort((a, b) => b[1] - a[1]).slice(0, this.cfg.technical_scope_top_k).map(([k]) => k)
      } else { selectedKcrs = allK }
    }

    const mismatch = at === 'Subtopic' ? this.scopeMismatch(req, selectedKcrs) : null
    let bestSibling = ''; let bestSiblingScore = 0; let directScore = 0
    if (mismatch) { bestSibling = mismatch.bestSibling; bestSiblingScore = mismatch.bestSiblingScore; directScore = mismatch.directScore; scopeFlag = 'SCOPE_MISMATCH_REANCHOR' }

    let evidenceNodes = this.graph.enrichKCRs(selectedKcrs)
    if (at === 'Semantic') evidenceNodes = Array.from(new Set([...evidenceNodes, ...semanticRank.slice(0, this.cfg.semantic_anchor_top_k).map(([id]) => id)])).sort()

    const facets = this.mechanismFacets(req)
    const [promotionFacets, negativePromotionFacets] = this.promotionFacetPartition(req)
    const contextScores = this.contextScores(req, facets)
    const topContexts = Array.from(contextScores.entries()).sort((a, b) => b[1] - a[1]).slice(0, this.cfg.context_top_k)

    const mechanismPresent = ['yes', 'true', '1'].includes((req.sustainability_mechanism_present || '').toLowerCase())
    let candidateRows: TopCandidate[] = []; let rec = ''; let recName = ''
    let promoted: string[] = []; let promotionTrace: Record<string, any> = {}; let status = ''
    let ranked: RankedEntry[] = []; let redirects: Map<string, string[]> = new Map()

    if (!mechanismPresent) { status = 'ABSTAIN_NO_SUSTAINABILITY_MECHANISM' }
    else if (mismatch) { status = 'ABSTAIN_SCOPE_MISMATCH_REANCHOR' }
    else {
      const result = this.scrScores(req, facets, promotionFacets, negativePromotionFacets, contextScores)
      ranked = result.ranked; redirects = result.redirects
      if (ranked.length > 0) {
        rec = ranked[0].sid; recName = this.repo.scrById.get(rec)?.name || ''
        const promotedResult = this.promotedScrs(ranked, promotionFacets)
        promoted = promotedResult.promoted; promotionTrace = promotedResult.trace
        status = 'RECOMMENDED_HYBRID_EVIDENCE'
        const bySid = new Map(ranked.map((r) => [r.sid, r]))
        const display: RankedEntry[] = [ranked[0]]
        for (const sid of promoted.slice(1)) if (bySid.has(sid) && sid !== rec) display.push(bySid.get(sid)!)
        for (const r of ranked.slice(1)) if (!promoted.slice(1).includes(r.sid)) display.push(r)
        const rawRank = new Map(ranked.map((r, i) => [r.sid, i + 1]))
        for (let rank = 0; rank < Math.min(display.length, this.cfg.scr_candidate_top_k); rank++) {
          const r = display[rank]; const sid = r.sid
          const pfvals = r.promotion_facet_scores
          let pidx = -1; let pscore = 0; let ptext = ''
          if (pfvals.length > 0) { pidx = pfvals.indexOf(Math.max(...pfvals)); pscore = pfvals[pidx]; ptext = pidx < promotionFacets.length ? promotionFacets[pidx] : '' }
          candidateRows.push({
            rank: rank + 1, raw_rank: rawRank.get(sid) || 0, scr_id: sid, scr_name: this.repo.scrById.get(sid)?.name || '',
            semantic_score: round(r.weighted_score, 6), evidence_tier: r.evidence_tier, mechanism_facet_max: round(r.mechanism_max, 6),
            full_profile_score: round(r.full_score, 6), context_evidence_score: round(r.context_score, 6),
            best_promotion_facet_index: pidx, best_promotion_facet_score: round(pscore, 6), best_promotion_facet_text: ptext,
            best_promotion_facet_lexical_match_count: r.promotion_lexical[pidx]?.[0] || 0,
            best_promotion_facet_lexical_score: round(r.promotion_lexical[pidx]?.[1] || 0, 6),
            best_promotion_facet_rare_match_count: r.promotion_lexical[pidx]?.[2] || 0,
            best_promotion_facet_idf_score: round(r.promotion_lexical[pidx]?.[3] || 0, 6),
            supporting_context_ids: r.supporting_contexts.slice(0, 3).map(([c]) => c).join('; '),
            promotion_path: promotionTrace[sid]?.path || '',
            negation_veto: r.negation_veto ? 'YES' : 'NO', negation_veto_facet_index: r.negation_veto_index,
            negation_veto_facet_text: r.negation_veto && r.negation_veto_index >= 0 && r.negation_veto_index < negativePromotionFacets.length ? negativePromotionFacets[r.negation_veto_index] : '',
            negation_veto_reason: r.negation_veto_reason,
            redirected_from: Array.from(new Set(redirects.get(sid) || [])).sort().join('; '),
          })
        }
      }
    }

    if (status === 'RECOMMENDED_HYBRID_EVIDENCE' && ranked.length > 0) {
      const top = ranked[0]
      if (top.weighted_score < 0.05 && top.mechanism_max < 0.05) { status = 'ABSTAIN_INSUFFICIENT_EVIDENCE'; rec = ''; recName = ''; promoted = [] }
    }

    return {
      test_id: req.test_id, test_dimension: req.test_dimension,
      semantic_backend: this.backend.name, semantic_backend_version: this.backend.version, embedding_dimension: this.backend.dimension,
      input_anchor_type: at, input_anchor_id: aid, course_hint: req.course_hint || '',
      resolution_type: resolutionType, resolution_id: resolutionId,
      selected_kcr_ids: selectedKcrs.join('; '), evidence_node_ids: evidenceNodes.join('; '),
      scope_status: scopeFlag, scope_mismatch_sibling: bestSibling, scope_mismatch_sibling_score: round(bestSiblingScore, 6), direct_anchor_score: round(directScore, 6),
      mechanism_present: req.sustainability_mechanism_present || '',
      mechanism_facets_json: JSON.stringify(facets), promotion_facets_json: JSON.stringify(promotionFacets),
      negative_promotion_facets_json: JSON.stringify(negativePromotionFacets),
      negation_vetoed_scr_ids: (mechanismPresent && !mismatch) ? ranked.filter((r) => r.negation_veto).map((r) => r.sid).join('; ') : '',
      top_context_ids: topContexts.map(([id]) => id).join('; '), top_context_scores: topContexts.map(([, s]) => s.toFixed(6)).join('; '),
      recommended_scr_id: rec, recommended_scr_name: recName, promoted_scr_ids: promoted.join('; '),
      decision_status: status, top_candidates_json: JSON.stringify(candidateRows),
      semantic_anchor_top_json: JSON.stringify(semanticRank.map(([id, score]) => ({ ID: id, Type: this.repo.types.get(id) || 'Unknown', Score: round(score, 6) }))),
    }
  }

  private semanticResolve(req: RecommendationRequest) {
    const hint = req.course_hint || ''
    const candidates = hint ? this.graph.semanticNodesForCourse(hint) : [...this.repo.kcrById.keys(), ...this.repo.kprById.keys(), ...this.repo.kfrById.keys()]
    const query = `${req.technical_query} ${req.application_context}`.trim()
    const scores = this.backend.similarity(query, candidates)
    const ranked = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).slice(0, this.cfg.semantic_anchor_top_k)
    const [bestId] = ranked[0] || ['', 0]
    const bestType = this.repo.types.get(bestId) || 'Unknown'
    let kids: string[]
    if (bestType === 'KCR') kids = [bestId]
    else if (bestType === 'KPR') kids = this.graph.getOutEdges(bestId).filter(([tp]) => tp === 'APPLIES_TO_KCR').map(([, t]) => t)
    else kids = this.graph.getOutEdges(bestId).filter(([tp]) => tp === 'ACTS_ON_KCR').map(([, t]) => t)
    if (hint) { const scope = new Set(this.graph.scopeKCRs('Course', hint)); const filtered = kids.filter((k) => scope.has(k)); if (filtered.length > 0) kids = filtered }
    return { type: bestType, id: bestId, kcrs: kids, ranked }
  }

  private scopeMismatch(req: RecommendationRequest, directKcrs: string[]) {
    if (req.anchor_type !== 'Subtopic' || directKcrs.length === 0) return null
    const sid = req.anchor_id; const mid = this.graph.getInEdges(sid).find(([tp]) => tp === 'CONTAINS_SUBTOPIC')?.[1] || ''
    const siblings = mid ? this.graph.scopeKCRs('Module', mid) : []
    if (siblings.length <= directKcrs.length) return null
    const q = `${req.technical_query} ${req.application_context}`.trim()
    const scores = this.backend.similarity(q, siblings)
    const bestDirect = Math.max(...directKcrs.map((k) => scores.get(k) || 0))
    let bestK = ''; let bestScore = 0
    for (const [k, s] of scores) if (s > bestScore) { bestScore = s; bestK = k }
    const mismatch = !directKcrs.includes(bestK) && bestScore >= this.cfg.subtopic_scope_mismatch_min_sibling && bestScore - bestDirect >= this.cfg.subtopic_scope_mismatch_margin
    return mismatch ? { bestSibling: bestK, bestSiblingScore: bestScore, directScore: bestDirect } : null
  }

  private appProfile(req: RecommendationRequest): string {
    return ['application_context','technical_system','operational_action','mechanism','affected_resource_or_function','stakeholder_or_ecological_context','boundary_conditions'].map((f) => (req as any)[f] || '').filter((s) => s).join(' ').trim()
  }

  private splitMechanismClauses(text: string): string[] {
    text = (text || '').trim(); if (!text) return []
    return text.split(/\s*;\s*|\s+\bwhile\b\s+|\s+\bwhereas\b\s+|\s+\bwhilst\b\s+/i).map((p) => p.trim().replace(/^[ ,.;]+|[ ,.;]+$/g, '')).filter((p) => p.split(/\s+/).length >= 3)
  }

  private hasActionRelation(text: string): boolean {
    const toks = (text || '').toLowerCase().match(/[a-z][a-z-]*/g) || []
    if (toks.length < 3) return false
    if (toks.slice(0, 8).some((t) => PROMOTION_ACTION_WORDS.has(t))) return true
    return toks.slice(0, 8).some((t) => t.length > 5 && (t.endsWith('ed') || t.endsWith('ing')))
  }

  private lexicalTokens(text: string): Set<string> {
    const toks: string[] = []; const raw = (text || '').toLowerCase().match(/[a-z][a-z0-9-]*/g) || []
    for (let r of raw) {
      r = r.replace(/^-+|-+$/g, '')
      if (STOP_WORDS_LEXICAL.has(r) || r.length < 3) continue
      if (r.length > 6 && r.endsWith('ies')) r = r.slice(0, -3) + 'y'
      else if (r.length > 6 && r.endsWith('ing')) r = r.slice(0, -3)
      else if (r.length > 5 && r.endsWith('ed')) r = r.slice(0, -2)
      else if (r.length > 5 && r.endsWith('es')) r = r.slice(0, -2)
      else if (r.length > 4 && r.endsWith('s')) r = r.slice(0, -1)
      if (!STOP_WORDS_LEXICAL.has(r) && r.length >= 3) toks.push(r)
    }
    return new Set(toks)
  }

  private promotionCanonicalText(sid: string): string {
    const r = this.repo.scrById.get(sid); if (!r) return ''
    return [r.name, r.keywords_synonyms, r.underlying_mechanism, r.recommendation_trigger, r.core_ideas, r.boundary_conditions].filter((s) => s).join(' ')
  }

  private promotionLexicalSupport(facet: string, sid: string): [number, number, number, number, string[]] {
    const ft = this.lexicalTokens(facet); const st = this.promotionTokenSets.get(sid) || new Set<string>()
    if (ft.size === 0 || st.size === 0) return [0, 0, 0, 0, []]
    const shared = [...ft].filter((t) => st.has(t))
    if (shared.length === 0) return [0, 0, 0, 0, []]
    const rawScore = shared.length / Math.sqrt(ft.size * st.size)
    const idfList: number[] = []; const rare: string[] = []
    for (const tok of shared) { const df = this.promotionTokenDf.get(tok) || 1; const w = Math.log((this.promotionTokenDocs + 1) / (df + 1)) + 1.0; idfList.push(w); if (df / this.promotionTokenDocs <= this.cfg.promotion_specific_rare_df_ratio) rare.push(tok) }
    const denom = Math.max(1, Math.min(ft.size, st.size))
    const idfScore = idfList.reduce((a, b) => a + b, 0) / (denom * 4.0)
    return [shared.length, rawScore, rare.length, idfScore, shared.sort()]
  }

  private isExplicitNegationFacet(text: string): boolean {
    const t = (text || '').replace(/\s+/g, ' ').trim().toLowerCase()
    if (!t) return false
    if (/^(?:no|without|never|neither|nor|not)\b/.test(t)) return true
    if (/\b(?:no|without)\s+(?:specific\s+)?[^.;,]{0,100}\b(?:is|are|was|were|be|been|being)?\s*(?:invoked|applied|used|assumed|specified|stated|present|included|required|claimed)\b/.test(t)) return true
    if (/\b(?:does|do|did|is|are|was|were|has|have|had)\s+not\s+(?:invoke|apply|use|assume|specify|state|include|require|claim|represent)\b/.test(t)) return true
    if (/\b(?:is|are|was|were)\s+(?:explicitly\s+)?(?:absent|ruled\s+out|excluded)\b/.test(t) && !t.includes('otherwise')) return true
    return false
  }

  private splitPromotionClauses(text: string): string[] {
    text = (text || '').replace(/\s+/g, ' ').trim().replace(/^[ ,.;]+|[ ,.;]+$/g, '')
    if (!text) return []
    const bases = text.split(/\s*;\s*|\s+\bwhile\b\s+|\s+\bwhereas\b\s+|\s+\bwhilst\b\s+/i).map((p) => p.trim().replace(/^[ ,.;]+|[ ,.;]+$/g, '')).filter((p) => p)
    const out: string[] = []; const seen = new Set<string>()
    for (const seg of bases) {
      const cps = seg.split(/\s*,\s*/).map((p) => p.replace(/^(?:and|or)\s+/i, '').trim().replace(/^[ ,.;]+|[ ,.;]+$/g, '')).filter((p) => p)
      const actionable = cps.filter((p) => p.split(/\s+/).length >= 3 && this.hasActionRelation(p))
      const finalSegs = actionable.length >= 2 ? actionable : [seg]
      for (let f of finalSegs) { f = f.replace(/\s+/g, ' ').trim().replace(/^[ ,.;]+|[ ,.;]+$/g, ''); const key = f.toLowerCase(); if (f.split(/\s+/).length >= 3 && !seen.has(key)) { out.push(f); seen.add(key) } }
    }
    return out.length > 0 ? out : [text]
  }

  private promotionFacetPartition(req: RecommendationRequest): [string[], string[]] {
    const allFacets = this.splitPromotionClauses(req.mechanism || '')
    const positive: string[] = []; const negative: string[] = []
    for (const f of allFacets) { if (this.isExplicitNegationFacet(f)) negative.push(f); else positive.push(f) }
    return [positive, negative]
  }

  private mechanismFacets(req: RecommendationRequest): string[] {
    const facets: string[] = [...this.splitMechanismClauses(req.mechanism || '')]
    const action = (req.operational_action || '').trim(); if (action) facets.push(action)
    const stakeholder = (req.stakeholder_or_ecological_context || '').trim(); const resource = (req.affected_resource_or_function || '').trim()
    if (stakeholder || resource) facets.push([stakeholder, resource].filter((x) => x).join(' '))
    const out: string[] = []; const seen = new Set<string>()
    for (const f of facets) { const key = f.toLowerCase().replace(/\s+/g, ' ').trim(); if (key && !seen.has(key)) { out.push(f); seen.add(key) } }
    if (out.length === 0) { const fallback = (req.application_context || '').trim(); if (fallback) out.push(fallback) }
    return out
  }

  private contextQuery(req: RecommendationRequest): string {
    return ['operational_action','mechanism','stakeholder_or_ecological_context','affected_resource_or_function','boundary_conditions'].map((f) => (req as any)[f] || '').filter((s) => s).join(' ').trim()
  }

  private contextScores(req: RecommendationRequest, facets: string[]): Map<string, number> {
    const cq = this.contextQuery(req)
    const base = this.backend.similarity(cq, this.repo.contextIds)
    const facetMaps = facets.filter((f) => f.trim()).map((f) => this.backend.similarity(f, this.repo.contextIds))
    const combined = new Map<string, number>()
    for (const cid of this.repo.contextIds) {
      const facetMax = facetMaps.length > 0 ? Math.max(...facetMaps.map((m) => m.get(cid) || 0)) : 0
      combined.set(cid, 0.65 * (base.get(cid) || 0) + 0.35 * facetMax)
    }
    return combined
  }

  private scrScores(req: RecommendationRequest, facets: string[], promotionFacets: string[], negativeFacets: string[], contextScores: Map<string, number>): { ranked: RankedEntry[]; redirects: Map<string, string[]> } {
    const appText = this.appProfile(req)
    const fullScores = this.backend.similarity(appText, this.repo.allScrIds)
    const facetMaps = facets.filter((f) => f.trim()).map((f) => this.backend.similarity(f, this.repo.allScrIds))
    const promotionFacetMaps = promotionFacets.filter((f) => f.trim()).map((f) => this.backend.similarity(f, this.repo.allScrIds))
    const negativeFacetMaps = negativeFacets.filter((f) => f.trim()).map((f) => this.backend.similarity(f, this.repo.allScrIds))

    const contextSupportScore = new Map<string, number>()
    const contextSupportIds = new Map<string, [string, number][]>()
    for (const [cid, cscore] of contextScores) {
      for (const sid of this.repo.contextSupports.get(cid) || []) {
        if (cscore > (contextSupportScore.get(sid) || 0)) contextSupportScore.set(sid, cscore)
        if (!contextSupportIds.has(sid)) contextSupportIds.set(sid, [])
        contextSupportIds.get(sid)!.push([cid, cscore])
      }
    }

    const collapsed = new Map<string, RankedEntry>(); const redirectSources = new Map<string, string[]>()
    for (const rawSid of this.repo.allScrIds) {
      const rawStatus = this.repo.scrById.get(rawSid)?.status; let sid = rawSid
      if (rawStatus !== 'Active') { if (!this.repo.mergeMap.has(rawSid)) continue; sid = this.repo.mergeMap.get(rawSid)!; if (!redirectSources.has(sid)) redirectSources.set(sid, []); redirectSources.get(sid)!.push(rawSid) }
      const full = fullScores.get(rawSid) || 0
      const facetValues = facetMaps.map((m) => m.get(rawSid) || 0)
      const mechanismMax = facetValues.length > 0 ? Math.max(...facetValues, full) : full
      const promotionValues = promotionFacetMaps.map((m) => m.get(rawSid) || 0)
      const promotionLexical = promotionFacets.map((f) => this.promotionLexicalSupport(f, sid))
      const negativeValues = negativeFacetMaps.map((m) => m.get(rawSid) || 0)
      const negativeLexical = negativeFacets.map((f) => this.promotionLexicalSupport(f, sid))

      let negationVeto = false; let negationVetoIdx = -1; let negationVetoReason = ''
      for (let nidx = 0; nidx < negativeValues.length; nidx++) {
        const nscore = negativeValues[nidx]; const nl = negativeLexical[nidx] || [0, 0, 0, 0, []]
        const [nlcount, , nrare, nidf, nshared] = nl
        let specific = nrare >= this.cfg.negation_veto_min_rare_matches && nidf >= this.cfg.negation_veto_min_idf_score
        specific = specific || (nlcount >= 2 && nidf >= 0.75 * this.cfg.negation_veto_min_idf_score)
        if (nscore >= this.cfg.negation_veto_min_semantic && specific) { negationVeto = true; negationVetoIdx = nidx; negationVetoReason = `NEGATED_FACET_MATCH:semantic=${nscore.toFixed(4)};idf=${nidf.toFixed(4)};shared=${nshared.join(',')}`; break }
      }

      const cscore = contextSupportScore.get(sid) || 0
      let evidenceTier = 0
      if (cscore >= this.cfg.strong_context_threshold && mechanismMax >= this.cfg.min_context_supported_mechanism_score) evidenceTier = 2
      const weighted = this.cfg.mechanism_weight * mechanismMax + this.cfg.full_profile_weight * full + this.cfg.context_evidence_weight * cscore

      const entry: RankedEntry = { sid, raw_sid: rawSid, evidence_tier: evidenceTier, weighted_score: weighted, mechanism_max: mechanismMax, full_score: full, context_score: cscore, promotion_facet_scores: promotionValues, promotion_lexical: promotionLexical, negative_facet_scores: negativeValues, negative_lexical: negativeLexical, negation_veto: negationVeto, negation_veto_index: negationVetoIdx, negation_veto_reason: negationVetoReason, supporting_contexts: (contextSupportIds.get(sid) || []).sort((a, b) => b[1] - a[1]) }
      const prev = collapsed.get(sid)
      const key = [evidenceTier, weighted, mechanismMax, cscore, full]
      if (!prev || compareKeys(key, [prev.evidence_tier, prev.weighted_score, prev.mechanism_max, prev.context_score, prev.full_score]) > 0) collapsed.set(sid, entry)
    }

    const ranked = Array.from(collapsed.values()).sort((a, b) => compareKeys([a.evidence_tier, a.weighted_score, a.mechanism_max, a.context_score, a.full_score], [b.evidence_tier, b.weighted_score, b.mechanism_max, b.context_score, b.full_score])).reverse()
    return { ranked, redirects: redirectSources }
  }

  private promotedScrs(ranked: RankedEntry[], promotionFacets: string[]): { promoted: string[]; trace: Record<string, any> } {
    if (ranked.length === 0) return { promoted: [], trace: {} }
    const top = ranked[0]; const promoted = [top.sid]; const promotedSet = new Set<string>([top.sid])
    const trace: Record<string, any> = { [top.sid]: { path: 'PRIMARY', facet_index: null } }
    const claimedFacets = new Set<number>()

    if (promotionFacets.length >= 2 && top.promotion_facet_scores.length > 0) {
      const vals = top.promotion_facet_scores; const strongest = vals.indexOf(Math.max(...vals)); claimedFacets.add(strongest)
      for (let idx = 0; idx < vals.length; idx++) {
        if (idx === strongest || vals[idx] < this.cfg.promotion_independent_min_facet_score) continue
        const tl = top.promotion_lexical[idx] || [0, 0, 0, 0, []]; const [, , topRare, topIdf] = tl
        const topSpecific = topRare >= 1 || topIdf >= 0.15; if (!topSpecific) continue
        let bestAltScore = 0; let bestAltIdf = 0
        for (const r of ranked.slice(1)) { const rvals = r.promotion_facet_scores; if (idx >= rvals.length) continue; const rl = r.promotion_lexical[idx] || [0, 0, 0, 0, []]; const [, , rrare, ridf] = rl; if (!(rrare >= 1 || ridf >= 0.15 || r.context_score >= this.cfg.promotion_independent_context_floor)) continue; if (rvals[idx] > bestAltScore) { bestAltScore = rvals[idx]; bestAltIdf = ridf } }
        if (bestAltScore <= 0 || (vals[idx] >= bestAltScore - 0.02 && topIdf >= 0.75 * bestAltIdf)) claimedFacets.add(idx)
      }
    }

    for (let i = 1; i < Math.min(ranked.length, this.cfg.promotion_candidate_pool); i++) {
      if (promoted.length >= this.cfg.promotion_max) break
      const r = ranked[i]; if (r.negation_veto) continue
      if (r.evidence_tier >= this.cfg.promotion_min_evidence_tier && r.mechanism_max >= this.cfg.min_context_supported_mechanism_score && top.weighted_score - r.weighted_score <= this.cfg.promotion_score_margin) {
        promoted.push(r.sid); promotedSet.add(r.sid)
        let pidx: number | null = null
        if (promotionFacets.length >= 2 && r.promotion_facet_scores.length > 0) { const vals = r.promotion_facet_scores; pidx = vals.indexOf(Math.max(...vals)); claimedFacets.add(pidx) }
        trace[r.sid] = { path: 'STRONG_CONTEXT', facet_index: pidx, context_score: r.context_score }
      }
    }

    if (promotionFacets.length >= 2 && promoted.length < this.cfg.promotion_max) {
      for (let idx = 0; idx < promotionFacets.length; idx++) {
        if (promoted.length >= this.cfg.promotion_max) break; if (claimedFacets.has(idx)) continue
        const facet = promotionFacets[idx]; const topvals = top.promotion_facet_scores; const topFacet = idx < topvals.length ? topvals[idx] : 0
        const facetPool: [number, number, RankedEntry][] = []
        for (let rawRank = 1; rawRank < ranked.length; rawRank++) { const r = ranked[rawRank]; if (promotedSet.has(r.sid)) continue; const vals = r.promotion_facet_scores; if (idx >= vals.length) continue; facetPool.push([vals[idx], -rawRank, r]) }
        facetPool.sort((a, b) => (b[0] - a[0]) || (b[1] - a[1]))
        const topPool = facetPool.slice(0, this.cfg.promotion_facet_local_top_k)
        const eligible: [number[], RankedEntry, any][] = []
        for (const [fscore, negRank, r] of topPool) {
          if (r.negation_veto) continue; const vals = r.promotion_facet_scores
          if (fscore < 0.93 * Math.max(...vals)) continue; if (fscore < this.cfg.promotion_independent_min_facet_score) continue
          if (r.weighted_score < this.cfg.promotion_independent_weighted_ratio * top.weighted_score) continue
          if (top.weighted_score - r.weighted_score > this.cfg.promotion_independent_score_margin) continue
          const lex = r.promotion_lexical; const [lcount, , rareCount, idfScore, shared] = lex[idx] || [0, 0, 0, 0, []]
          const topLex = top.promotion_lexical; const [, , topRare, topIdf] = topLex[idx] || [0, 0, 0, 0, []]
          const contextSpecific = r.context_score >= this.cfg.promotion_independent_context_floor
          let lexicalSpecific = rareCount >= 1 && idfScore >= this.cfg.promotion_specific_min_idf_score
          lexicalSpecific = lexicalSpecific || (lcount >= 2 && idfScore >= 1.5 * this.cfg.promotion_specific_min_idf_score)
          if (!contextSpecific && !lexicalSpecific) continue
          const semanticGain = fscore - topFacet >= this.cfg.promotion_independent_facet_advantage
          const relativeGain = topFacet <= 0 || fscore >= this.cfg.promotion_independent_facet_ratio_over_primary * topFacet
          const specificityGain = rareCount > topRare || idfScore >= topIdf + 0.025 || contextSpecific
          if (!((semanticGain && relativeGain && specificityGain) || (contextSpecific && fscore >= topFacet + 0.015))) continue
          const scoreKey = [rareCount, idfScore, contextSpecific ? 1 : 0, fscore, r.weighted_score, negRank]
          eligible.push([scoreKey, r, { path: 'INDEPENDENT_FACET', facet_index: idx, facet_text: facet, facet_score: fscore, top_facet_score: topFacet, context_score: r.context_score, lexical_match_count: lcount, rare_match_count: rareCount, idf_score: idfScore, shared_tokens: shared }])
        }
        if (eligible.length > 0) {
          eligible.sort((a, b) => compareKeys(a[0], b[0]))
          const [, r, tr] = eligible[eligible.length - 1]
          promoted.push(r.sid); promotedSet.add(r.sid); claimedFacets.add(idx); trace[r.sid] = tr
        }
      }
    }
    return { promoted, trace }
  }
}

function compareKeys(a: number[], b: number[]): number { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0 }
function round(v: number, digits: number): number { const f = Math.pow(10, digits); return Math.round(v * f) / f }
