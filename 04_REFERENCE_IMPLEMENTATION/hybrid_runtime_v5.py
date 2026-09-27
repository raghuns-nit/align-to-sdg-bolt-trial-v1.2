#!/usr/bin/env python3
"""Hybrid semantic + controlled-KG recommendation prototype v5a / Design-8a.

Design-8a retains the validated Design-8 facet-local secondary search and adds
polarity-aware secondary-promotion safety:
  * Explicitly negated/excluded mechanism facets are exclusion evidence only.
  * Negated facets never generate or strengthen positive secondary promotion.
  * A secondary SCR that specifically matches a negated facet is vetoed even if
    semantic/context similarity is otherwise high.

Design-8 retains the validated Design-7 primary ranking and adds:
  * Facet-local secondary candidate discovery instead of relying only on the global Top-N.
  * Specificity-aware lexical evidence using corpus rarity, so generic overlap cannot create eligibility.
  * Curated-context evidence remains a valid secondary path.
  * Primary Top-1 ranking, scope gates, guardrails and abstention remain unchanged.
  * Raw global ranking and promoted/display ranking are both retained for audit.
  * No gold labels or RELATED_TO_SCR edges are used for promotion eligibility.

Prediction does NOT read gold labels.
"""
from __future__ import annotations
import argparse, csv, json, os, re
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, List

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import Normalizer
from sklearn.pipeline import make_pipeline


def read_csv(path: str) -> List[dict]:
    with open(path, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: str, rows: List[dict], fieldnames: List[str]) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)


def join_text(r: dict, fields: List[str]) -> str:
    return " ".join(
        str(r.get(f, "") or "").strip()
        for f in fields
        if str(r.get(f, "") or "").strip()
    )


class LSAEmbeddingBackend:
    name = "lsa-256-surrogate"

    def __init__(self, corpus: Dict[str, str]):
        self.ids = list(corpus)
        docs = [corpus[i] for i in self.ids]
        self.vectorizer = TfidfVectorizer(
            stop_words="english", ngram_range=(1, 2),
            sublinear_tf=True, min_df=1, max_df=0.995
        )
        X = self.vectorizer.fit_transform(docs)
        ncomp = min(256, max(32, min(X.shape) - 1))
        self.model = make_pipeline(
            TruncatedSVD(n_components=ncomp, random_state=42),
            Normalizer(copy=False)
        )
        self.emb = self.model.fit_transform(X)
        self.index = {i: n for n, i in enumerate(self.ids)}
        self.dimension = ncomp
        self.version = f"sklearn-lsa-{ncomp}d"

    def encode(self, texts: List[str]) -> np.ndarray:
        return self.model.transform(self.vectorizer.transform(texts))

    def similarity(self, query: str, ids: List[str]) -> Dict[str, float]:
        if not query.strip():
            return {i: 0.0 for i in ids}
        q = self.encode([query])[0]
        return {i: float(self.emb[self.index[i]].dot(q)) for i in ids}


class SentenceTransformerBackend:
    name = "sentence-transformer"

    def __init__(self, corpus: Dict[str, str], model_name: str):
        from sentence_transformers import SentenceTransformer
        self.ids = list(corpus)
        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        self.emb = self.model.encode(
            [corpus[i] for i in self.ids],
            normalize_embeddings=True,
            show_progress_bar=False
        )
        self.index = {i: n for n, i in enumerate(self.ids)}
        self.dimension = int(self.emb.shape[1])
        self.version = model_name

    def encode(self, texts: List[str]) -> np.ndarray:
        return self.model.encode(
            texts, normalize_embeddings=True, show_progress_bar=False
        )

    def similarity(self, query: str, ids: List[str]) -> Dict[str, float]:
        if not query.strip():
            return {i: 0.0 for i in ids}
        q = self.encode([query])[0]
        return {i: float(np.dot(self.emb[self.index[i]], q)) for i in ids}


@dataclass
class RuntimeConfig:
    semantic_backend: str = "auto"
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"

    semantic_anchor_top_k: int = 10
    technical_scope_top_k: int = 5
    scr_candidate_top_k: int = 5
    context_top_k: int = 5

    subtopic_scope_mismatch_margin: float = 0.12
    subtopic_scope_mismatch_min_sibling: float = 0.45

    # General evidence tiers; not case-specific.
    strong_context_threshold: float = 0.62
    moderate_context_threshold: float = 0.44
    min_context_supported_mechanism_score: float = 0.22

    # Within an evidence tier, mechanism specificity is primary.
    mechanism_weight: float = 0.55
    full_profile_weight: float = 0.35
    context_evidence_weight: float = 0.10

    # Trace-only multi-label promotion rule.
    promotion_min_evidence_tier: int = 2
    promotion_min_mechanism_score: float = 0.28
    promotion_score_margin: float = 0.16
    promotion_max: int = 3

    # Design-7 independent-facet promotion. Relative conditions are emphasized
    # so the rule is less sensitive to embedding-model cosine scale.
    promotion_candidate_pool: int = 10
    promotion_facet_local_top_k: int = 12
    promotion_independent_min_facet_score: float = 0.26
    promotion_independent_context_floor: float = 0.40
    promotion_specific_rare_df_ratio: float = 0.18
    promotion_specific_min_idf_score: float = 0.075
    promotion_independent_facet_advantage: float = 0.025
    promotion_independent_facet_ratio_over_primary: float = 1.08
    promotion_independent_weighted_ratio: float = 0.52
    promotion_independent_score_margin: float = 0.34

    # Design-8a explicit-negation veto for SECONDARY promotion only.
    # A candidate must match a negated facet semantically AND with specific
    # canonical evidence before the veto fires; this avoids turning every
    # incidental word such as 'not changed' into a global exclusion.
    negation_veto_min_semantic: float = 0.30
    negation_veto_min_idf_score: float = 0.10
    negation_veto_min_rare_matches: int = 1


class HybridRuntime:
    def __init__(self, repo_dir: str, cfg: RuntimeConfig):
        self.repo_dir, self.cfg = repo_dir, cfg

        self.course = read_csv(os.path.join(repo_dir, "01_course.csv"))
        self.module = read_csv(os.path.join(repo_dir, "02_module.csv"))
        self.sub = read_csv(os.path.join(repo_dir, "03_subtopic.csv"))
        self.kcr = read_csv(os.path.join(repo_dir, "04_kcr.csv"))
        self.kpr = read_csv(os.path.join(repo_dir, "05_kpr.csv"))
        self.kfr = read_csv(os.path.join(repo_dir, "06_kfr.csv"))
        self.scr = read_csv(os.path.join(repo_dir, "07_scr.csv"))
        self.guard = read_csv(os.path.join(repo_dir, "08_guardrail.csv"))
        self.ctx = read_csv(os.path.join(repo_dir, "09_application_context.csv"))
        self.rel = read_csv(os.path.join(repo_dir, "relationships.csv"))

        self.course_by = {r["course_id:ID"]: r for r in self.course}
        self.module_by = {r["module_id:ID"]: r for r in self.module}
        self.sub_by = {r["subtopic_id:ID"]: r for r in self.sub}
        self.kcr_by = {r["kcr_id:ID"]: r for r in self.kcr}
        self.kpr_by = {r["kpr_id:ID"]: r for r in self.kpr}
        self.kfr_by = {r["kfr_id:ID"]: r for r in self.kfr}
        self.scr_by = {r["scr_id:ID"]: r for r in self.scr}
        self.ctx_by = {r["application_context_id:ID"]: r for r in self.ctx}

        self.out, self.inn = defaultdict(list), defaultdict(list)
        for r in self.rel:
            s, t, tp = r[":START_ID"], r[":END_ID"], r[":TYPE"]
            self.out[s].append((tp, t))
            self.inn[t].append((tp, s))

        self.texts, self.types = self._semantic_corpus()
        self.backend = self._make_backend(cfg.semantic_backend)

        self.all_scr_ids = [r["scr_id:ID"] for r in self.scr]
        self.active_scr_ids = [
            r["scr_id:ID"] for r in self.scr if r.get("status") == "Active"
        ]
        self.context_ids = [
            r["application_context_id:ID"]
            for r in self.ctx if r.get("status") == "Active"
        ]

        self.merge_map = {}
        for sid in self.all_scr_ids:
            for tp, t in self.out[sid]:
                if tp == "MERGED_INTO":
                    self.merge_map[sid] = t

        # Explicit curated evidence bridge.
        self.context_supports = defaultdict(list)
        for cid in self.context_ids:
            for tp, target in self.out[cid]:
                if tp == "EVIDENCE_SUPPORTS":
                    if target in self.merge_map:
                        target = self.merge_map[target]
                    if target in self.scr_by and self.scr_by[target].get("status") == "Active":
                        self.context_supports[cid].append(target)

        # Design-8: token document-frequency over canonical SCR promotion text.
        # This makes generic words weak evidence and preserves rare mechanism cues.
        self._promotion_token_df = defaultdict(int)
        self._promotion_token_sets = {}
        for sid in self.active_scr_ids:
            toks = self._lexical_tokens(self._promotion_canonical_text(sid))
            self._promotion_token_sets[sid] = toks
            for tok in toks:
                self._promotion_token_df[tok] += 1
        self._promotion_token_docs = max(1, len(self.active_scr_ids))

    def _make_backend(self, requested: str):
        if requested in ("auto", "sentence-transformer"):
            try:
                return SentenceTransformerBackend(self.texts, self.cfg.model_name)
            except Exception:
                if requested == "sentence-transformer":
                    raise
        return LSAEmbeddingBackend(self.texts)

    def _semantic_corpus(self):
        texts, types = {}, {}
        sets = [
            (self.course, "course_id:ID", "Course",
             ["title", "description", "objectives", "learning_outcomes"]),
            (self.module, "module_id:ID", "Module",
             ["name", "description"]),
            (self.sub, "subtopic_id:ID", "Subtopic",
             ["name", "description"]),
            (self.kcr, "kcr_id:ID", "KCR",
             ["name", "definition", "scope", "core_principles",
              "semantic_description", "keywords_synonyms"]),
            (self.kpr, "kpr_id:ID", "KPR",
             ["name", "definition", "scope", "core_ideas",
              "semantic_description", "keywords_synonyms"]),
            (self.kfr, "kfr_id:ID", "KFR",
             ["name", "definition", "scope", "purpose", "inputs", "outputs",
              "realization_or_mechanism", "semantic_description",
              "keywords_synonyms"]),
            (self.scr, "scr_id:ID", "SCR",
             ["name", "definition", "scope", "core_ideas",
              "semantic_description", "keywords_synonyms",
              "sustainability_principle", "underlying_mechanism",
              "boundary_conditions", "recommendation_trigger"]),
            (self.ctx, "application_context_id:ID", "ApplicationContext",
             ["name", "description", "technical_problem", "operational_action",
              "mechanism", "sustainability_outcome", "boundary_conditions",
              "keywords_synonyms"]),
        ]
        for rows, idf, tp, fields in sets:
            for r in rows:
                i = r[idf]
                texts[i] = join_text(r, fields)
                types[i] = tp
        return texts, types

    def _scope_kcrs(self, typ: str, ident: str) -> List[str]:
        if typ == "Subtopic":
            return [t for tp, t in self.out[ident] if tp == "MAPS_TO_KCR"]

        if typ == "Module":
            sids = [t for tp, t in self.out[ident] if tp == "CONTAINS_SUBTOPIC"]
            return list(dict.fromkeys(
                t for sid in sids
                for tp, t in self.out[sid] if tp == "MAPS_TO_KCR"
            ))

        if typ == "Course":
            mids = [t for tp, t in self.out[ident] if tp == "CONTAINS_MODULE"]
            sids = [
                t for mid in mids
                for tp, t in self.out[mid] if tp == "CONTAINS_SUBTOPIC"
            ]
            return list(dict.fromkeys(
                t for sid in sids
                for tp, t in self.out[sid] if tp == "MAPS_TO_KCR"
            ))

        return []

    def _module_of_sub(self, sid):
        return next(
            (src for tp, src in self.inn[sid] if tp == "CONTAINS_SUBTOPIC"), ""
        )

    def _course_of_module(self, mid):
        return next(
            (src for tp, src in self.inn[mid] if tp == "CONTAINS_MODULE"), ""
        )

    def _semantic_nodes_for_course(self, cid):
        kids = self._scope_kcrs("Course", cid)
        nodes = set(kids)
        for kid in kids:
            nodes.update(
                src for tp, src in self.inn[kid]
                if tp == "APPLIES_TO_KCR" and src in self.kpr_by
            )
            nodes.update(
                src for tp, src in self.inn[kid]
                if tp == "ACTS_ON_KCR" and src in self.kfr_by
            )
        return list(nodes)

    def _enrich_kcrs(self, kids: List[str]) -> List[str]:
        e = set(kids)
        for kid in kids:
            e.update(
                src for tp, src in self.inn[kid]
                if tp == "APPLIES_TO_KCR" and src in self.kpr_by
            )
            e.update(
                src for tp, src in self.inn[kid]
                if tp == "ACTS_ON_KCR" and src in self.kfr_by
            )
        return sorted(e)

    def _semantic_resolve(self, case: dict):
        hint = case.get("Course_Hint", "")
        candidates = (
            self._semantic_nodes_for_course(hint)
            if hint
            else list(self.kcr_by) + list(self.kpr_by) + list(self.kfr_by)
        )
        query = (
            case.get("Technical_Query", "") + " " +
            case.get("Application_Context", "")
        ).strip()

        scores = self.backend.similarity(query, candidates)
        ranked = sorted(
            scores.items(), key=lambda x: x[1], reverse=True
        )[:self.cfg.semantic_anchor_top_k]

        best_id, best_score = ranked[0]
        best_type = self.types[best_id]

        if best_type == "KCR":
            kids = [best_id]
        elif best_type == "KPR":
            kids = [t for tp, t in self.out[best_id] if tp == "APPLIES_TO_KCR"]
        else:
            kids = [t for tp, t in self.out[best_id] if tp == "ACTS_ON_KCR"]

        if hint:
            scope = set(self._scope_kcrs("Course", hint))
            kids = [k for k in kids if k in scope] or kids

        return best_type, best_id, best_score, kids, ranked

    def _scope_mismatch(self, case: dict, direct_kcrs: List[str]):
        if case["Anchor_Type"] != "Subtopic" or not direct_kcrs:
            return False, "", 0.0, 0.0

        sid = case["Anchor_ID"]
        mid = self._module_of_sub(sid)
        siblings = self._scope_kcrs("Module", mid) if mid else []

        if len(siblings) <= len(direct_kcrs):
            return False, "", 0.0, 0.0

        q = (
            case["Technical_Query"] + " " + case["Application_Context"]
        ).strip()
        scores = self.backend.similarity(q, siblings)

        best_direct = max(scores.get(k, 0.0) for k in direct_kcrs)
        best_k, best_score = max(scores.items(), key=lambda x: x[1])

        mismatch = (
            best_k not in direct_kcrs
            and best_score >= self.cfg.subtopic_scope_mismatch_min_sibling
            and best_score - best_direct >= self.cfg.subtopic_scope_mismatch_margin
        )
        return mismatch, best_k, best_score, best_direct

    @staticmethod
    def _app_profile(case: dict) -> str:
        fields = [
            "Application_Context", "Technical_System", "Operational_Action",
            "Mechanism", "Affected_Resource_or_Function",
            "Stakeholder_or_Ecological_Context", "Boundary_Conditions"
        ]
        return " ".join(
            case.get(f, "") for f in fields if case.get(f, "")
        ).strip()

    @staticmethod
    def _split_mechanism_clauses(text: str) -> List[str]:
        """Conservative semantic-facet splitter.

        Splits only on explicit contrast/coexistence markers and semicolons.
        It intentionally does not split every 'and', which would fragment normal
        technical phrases.
        """
        text = (text or "").strip()
        if not text:
            return []
        parts = re.split(
            r"\s*;\s*|\s+\bwhile\b\s+|\s+\bwhereas\b\s+|\s+\bwhilst\b\s+",
            text, flags=re.IGNORECASE
        )
        return [p.strip(" ,.;") for p in parts if len(p.split()) >= 3]

    @staticmethod
    def _promotion_action_words():
        return {
            "adapt", "adapts", "adjust", "adjusts", "align", "aligns",
            "allocate", "allocates", "analyse", "analyze", "assess", "assign",
            "assigns", "avoid", "avoids", "build", "builds", "compare", "compares",
            "contribute", "contributes", "coordinate", "coordinates", "correct",
            "corrects", "define", "defines", "design", "designs", "document",
            "documents", "evaluate", "evaluates", "extend", "extends", "fund",
            "funds", "give", "gives", "guide", "guides", "identify", "identifies",
            "improve", "improves", "incorporate", "incorporates", "increase",
            "increases", "influence", "influences", "invite", "invites", "maintain",
            "maintains", "manage", "manages", "map", "maps", "monitor", "monitors",
            "prevent", "prevents", "protect", "protects", "publish", "publishes",
            "recover", "recovers", "reduce", "reduces", "require", "requires",
            "restore", "restores", "review", "reviews", "revise", "revises",
            "select", "selects", "shift", "shifts", "support", "supports", "target",
            "targets", "track", "tracks", "transfer", "transfers", "use", "uses",
            "verify", "verifies", "hold", "holds", "receive", "receives", "explain",
            "explains", "include", "includes", "maintain", "maintains", "compare",
            "compares", "can", "could", "should", "must"
        }

    @classmethod
    def _has_action_relation(cls, text: str) -> bool:
        toks = re.findall(r"[a-z][a-z-]*", (text or "").lower())
        if len(toks) < 3:
            return False
        words = cls._promotion_action_words()
        if any(tok in words for tok in toks[:8]):
            return True
        return any(len(tok) > 5 and (tok.endswith("ed") or tok.endswith("ing")) for tok in toks[:8])

    @staticmethod
    def _lexical_tokens(text: str):
        stop={
            "the","a","an","and","or","of","to","in","on","for","with","by","from","as","at","that","this","these","those",
            "is","are","was","were","be","been","being","can","could","should","would","may","might","must","will","when","where",
            "using","used","use","uses","into","over","under","before","after","through","across","than","rather","only","also","their",
            "system","systems","sustainability","sustainable","decision","decisions","action","actions","outcome","outcomes","application",
            "relevant","material","materials","process","processes","management","context","criteria"
        }
        toks=[]
        for raw in re.findall(r"[a-z][a-z0-9-]*", (text or "").lower()):
            tok=raw.strip("-")
            if tok in stop or len(tok)<3:
                continue
            if len(tok)>6 and tok.endswith("ies"):
                tok=tok[:-3]+"y"
            elif len(tok)>6 and tok.endswith("ing"):
                tok=tok[:-3]
            elif len(tok)>5 and tok.endswith("ed"):
                tok=tok[:-2]
            elif len(tok)>5 and tok.endswith("es"):
                tok=tok[:-2]
            elif len(tok)>4 and tok.endswith("s"):
                tok=tok[:-1]
            if tok not in stop and len(tok)>=3:
                toks.append(tok)
        return set(toks)

    def _promotion_canonical_text(self, sid: str) -> str:
        r=self.scr_by[sid]
        return " ".join(str(r.get(f,"") or "") for f in [
            "name","keywords_synonyms","underlying_mechanism","recommendation_trigger",
            "core_ideas","boundary_conditions"
        ])

    def _promotion_lexical_support(self, facet: str, sid: str):
        """Specificity-aware canonical SCR support for one mechanism facet.

        Returns raw overlap for backward trace compatibility plus rare-token and
        IDF-weighted evidence.  Generic terms alone therefore cannot create a
        secondary promotion.
        """
        ft=self._lexical_tokens(facet)
        st=self._promotion_token_sets.get(sid)
        if st is None:
            st=self._lexical_tokens(self._promotion_canonical_text(sid))
        shared=ft & st
        if not ft or not st:
            return 0,0.0,0,0.0,[]
        raw_score=len(shared)/((len(ft)*len(st))**0.5)
        import math
        idf=[]; rare=[]
        for tok in shared:
            df=self._promotion_token_df.get(tok,1)
            w=math.log((self._promotion_token_docs+1)/(df+1))+1.0
            idf.append(w)
            if df/self._promotion_token_docs <= self.cfg.promotion_specific_rare_df_ratio:
                rare.append(tok)
        # Normalize weighted overlap by the smaller token set so a concise,
        # mechanism-specific facet can still receive strong support.
        denom=max(1.0, min(len(ft),len(st)))
        idf_score=sum(idf)/(denom*4.0)
        return len(shared),raw_score,len(rare),idf_score,sorted(shared)

    @classmethod
    def _split_promotion_clauses(cls, text: str) -> List[str]:
        """Extract independent action-bearing clauses conservatively.

        Unlike the v3 ranking splitter, this is used only for *secondary-label
        promotion*. It recognizes explicit compound-mechanism constructions but
        does not split noun lists such as "cost, maintenance and service life".
        """
        text = re.sub(r"\s+", " ", (text or "")).strip(" ,.;")
        if not text:
            return []

        # Start with the boundaries already accepted by v3.
        bases = [p.strip(" ,.;") for p in re.split(
            r"\s*;\s*|\s+\bwhile\b\s+|\s+\bwhereas\b\s+|\s+\bwhilst\b\s+",
            text, flags=re.IGNORECASE
        ) if p.strip(" ,.;")]

        expanded = []
        explicit = re.compile(
            r"\s+\b(?:and\s+also|as\s+well\s+as|together\s+with|so\s+that|thereby)\b\s+",
            flags=re.IGNORECASE
        )
        for base in bases:
            parts=[p.strip(" ,.;") for p in explicit.split(base) if p.strip(" ,.;")]
            expanded.extend(parts if len(parts)>1 else [base])

        # Split comma-coordinated action clauses only when at least two resulting
        # parts independently contain an action relation.
        comma_expanded=[]
        for seg in expanded:
            cps=[re.sub(r"^(?:and|or)\s+", "", p.strip(" ,.;"), flags=re.IGNORECASE)
                 for p in re.split(r"\s*,\s*", seg) if p.strip(" ,.;")]
            actionable=[p for p in cps if len(p.split())>=3 and cls._has_action_relation(p)]
            comma_expanded.extend(actionable if len(actionable)>=2 else [seg])

        # Plain 'and' is a boundary only when both sides are substantial
        # action-bearing clauses. Apply at most one split per segment to avoid
        # combinatorial fragments from enumerations.
        final=[]
        for seg in comma_expanded:
            split_done=False
            for m in re.finditer(r"\s+\band\b\s+", seg, flags=re.IGNORECASE):
                left=seg[:m.start()].strip(" ,.;"); right=seg[m.end():].strip(" ,.;")
                if (len(left.split())>=4 and len(right.split())>=4
                    and cls._has_action_relation(left) and cls._has_action_relation(right)):
                    final.extend([left,right]); split_done=True; break
            if not split_done:
                final.append(seg)

        out=[]; seen=set()
        for f in final:
            f=re.sub(r"\s+", " ", f).strip(" ,.;")
            key=f.lower()
            if len(f.split())>=3 and key not in seen:
                out.append(f); seen.add(key)
        return out or [text]

    @staticmethod
    def _is_explicit_negation_facet(text: str) -> bool:
        """Return True only for clauses whose *mechanism proposition* is negated.

        This is intentionally conservative.  Phrases such as "did not change
        the final condition" or "would otherwise be excluded" describe an
        outcome/counterfactual and must not cause the whole positive mechanism
        facet to be treated as exclusion evidence.
        """
        t=re.sub(r"\s+"," ",(text or "").strip().lower())
        if not t:
            return False
        # Strong clause-initial exclusion markers.
        if re.match(r"^(?:no|without|never|neither|nor|not)\b", t):
            return True
        # Explicit absence / rule-not-invoked constructions.
        if re.search(r"\b(?:no|without)\s+(?:specific\s+)?[^.;,]{0,100}\b(?:is|are|was|were|be|been|being)?\s*(?:invoked|applied|used|assumed|specified|stated|present|included|required|claimed)\b", t):
            return True
        if re.search(r"\b(?:does|do|did|is|are|was|were|has|have|had)\s+not\s+(?:invoke|apply|use|assume|specify|state|include|require|claim|represent)\b", t):
            return True
        if re.search(r"\b(?:is|are|was|were)\s+(?:explicitly\s+)?(?:absent|ruled\s+out|excluded)\b", t) and "otherwise" not in t:
            return True
        return False

    def _promotion_facet_partition(self, case: dict):
        all_facets=self._split_promotion_clauses(case.get("Mechanism", ""))
        positive=[]; negative=[]
        for f in all_facets:
            (negative if self._is_explicit_negation_facet(f) else positive).append(f)
        return positive, negative

    def _promotion_facets(self, case: dict) -> List[str]:
        return self._promotion_facet_partition(case)[0]

    def _negative_promotion_facets(self, case: dict) -> List[str]:
        return self._promotion_facet_partition(case)[1]

    def _mechanism_facets(self, case: dict) -> List[str]:
        facets = []

        mechanism = case.get("Mechanism", "")
        facets.extend(self._split_mechanism_clauses(mechanism))

        action = case.get("Operational_Action", "").strip()
        if action:
            facets.append(action)

        stakeholder = case.get("Stakeholder_or_Ecological_Context", "").strip()
        resource = case.get("Affected_Resource_or_Function", "").strip()
        if stakeholder or resource:
            facets.append(" ".join(x for x in [stakeholder, resource] if x))

        # Preserve order, remove near-identical duplicate text.
        out = []
        seen = set()
        for f in facets:
            key = re.sub(r"\s+", " ", f.lower()).strip()
            if key and key not in seen:
                out.append(f)
                seen.add(key)

        if not out:
            fallback = case.get("Application_Context", "").strip()
            if fallback:
                out.append(fallback)
        return out

    def _context_query(self, case: dict) -> str:
        """Mechanism-focused context query.

        Excludes Technical_Query/Technical_System so context retrieval is not
        dominated by domain nouns such as 'pipe network' or 'cloud'.
        """
        fields = [
            "Operational_Action", "Mechanism",
            "Stakeholder_or_Ecological_Context",
            "Affected_Resource_or_Function", "Boundary_Conditions"
        ]
        return " ".join(
            case.get(f, "") for f in fields if case.get(f, "")
        ).strip()

    def _context_scores(self, case: dict, facets: List[str]):
        cq = self._context_query(case)
        base = self.backend.similarity(cq, self.context_ids)

        facet_maps = [
            self.backend.similarity(f, self.context_ids)
            for f in facets if f.strip()
        ]

        combined = {}
        for cid in self.context_ids:
            facet_max = max((m.get(cid, 0.0) for m in facet_maps), default=0.0)
            # Context must resemble the mechanism-focused profile, with facet
            # matching used to preserve multi-mechanism signals.
            combined[cid] = 0.65 * base.get(cid, 0.0) + 0.35 * facet_max
        return combined

    def _scr_scores(self, case: dict, facets: List[str], promotion_facets: List[str], negative_facets: List[str], context_scores: Dict[str, float]):
        app_text = self._app_profile(case)
        full_scores = self.backend.similarity(app_text, self.all_scr_ids)

        facet_maps = [
            self.backend.similarity(f, self.all_scr_ids)
            for f in facets if f.strip()
        ]
        promotion_facet_maps = [
            self.backend.similarity(f, self.all_scr_ids)
            for f in promotion_facets if f.strip()
        ]
        negative_facet_maps = [
            self.backend.similarity(f, self.all_scr_ids)
            for f in negative_facets if f.strip()
        ]

        context_support_score = defaultdict(float)
        context_support_ids = defaultdict(list)
        for cid, cscore in context_scores.items():
            for sid in self.context_supports.get(cid, []):
                if cscore > context_support_score[sid]:
                    context_support_score[sid] = cscore
                context_support_ids[sid].append((cid, cscore))

        collapsed = {}
        redirect_sources = defaultdict(list)

        for raw_sid in self.all_scr_ids:
            raw_status = self.scr_by[raw_sid].get("status")
            sid = raw_sid

            if raw_status != "Active":
                if raw_sid not in self.merge_map:
                    continue
                sid = self.merge_map[raw_sid]
                redirect_sources[sid].append(raw_sid)

            full = full_scores.get(raw_sid, 0.0)
            facet_values = [m.get(raw_sid, 0.0) for m in facet_maps]
            mechanism_max = max(facet_values, default=full)
            promotion_values = [m.get(raw_sid, 0.0) for m in promotion_facet_maps]
            promotion_lexical = [self._promotion_lexical_support(f, sid) for f in promotion_facets]
            negative_values = [m.get(raw_sid, 0.0) for m in negative_facet_maps]
            negative_lexical = [self._promotion_lexical_support(f, sid) for f in negative_facets]

            negation_veto=False; negation_veto_idx=-1; negation_veto_reason=""
            for nidx,nscore in enumerate(negative_values):
                nl=(negative_lexical[nidx] if nidx < len(negative_lexical) else (0,0.0,0,0.0,[]))
                nlcount,_,nrare,nidf,nshared=nl
                specific=(nrare >= self.cfg.negation_veto_min_rare_matches and nidf >= self.cfg.negation_veto_min_idf_score)
                specific=specific or (nlcount>=2 and nidf>=0.75*self.cfg.negation_veto_min_idf_score)
                if nscore >= self.cfg.negation_veto_min_semantic and specific:
                    negation_veto=True; negation_veto_idx=nidx
                    negation_veto_reason=f"NEGATED_FACET_MATCH:semantic={nscore:.4f};idf={nidf:.4f};shared={','.join(nshared)}"
                    break

            cscore = context_support_score.get(sid, 0.0)

            # Only strong curated-context matches receive precedence.
            # Moderate context similarity remains soft ranking evidence and must
            # not outrank a much stronger direct mechanism match.
            if (
                cscore >= self.cfg.strong_context_threshold
                and mechanism_max >= self.cfg.min_context_supported_mechanism_score
            ):
                evidence_tier = 2
            else:
                evidence_tier = 0

            weighted = (
                self.cfg.mechanism_weight * mechanism_max
                + self.cfg.full_profile_weight * full
                + self.cfg.context_evidence_weight * cscore
            )

            entry = {
                "sid": sid,
                "raw_sid": raw_sid,
                "evidence_tier": evidence_tier,
                "weighted_score": weighted,
                "mechanism_max": mechanism_max,
                "full_score": full,
                "context_score": cscore,
                "promotion_facet_scores": promotion_values,
                "promotion_lexical": promotion_lexical,
                "negative_facet_scores": negative_values,
                "negative_lexical": negative_lexical,
                "negation_veto": negation_veto,
                "negation_veto_index": negation_veto_idx,
                "negation_veto_reason": negation_veto_reason,
                "supporting_contexts": sorted(
                    context_support_ids.get(sid, []),
                    key=lambda x: x[1], reverse=True
                )
            }

            # If a deprecated synonym maps to an active SCR, retain the strongest
            # evidence representation for the active target.
            prev = collapsed.get(sid)
            key = (
                evidence_tier, weighted, mechanism_max,
                cscore, full
            )
            prev_key = (
                prev["evidence_tier"], prev["weighted_score"],
                prev["mechanism_max"], prev["context_score"], prev["full_score"]
            ) if prev else None
            if prev is None or key > prev_key:
                collapsed[sid] = entry

        ranked = sorted(
            collapsed.values(),
            key=lambda x: (
                x["evidence_tier"],
                x["weighted_score"],
                x["mechanism_max"],
                x["context_score"],
                x["full_score"]
            ),
            reverse=True
        )

        return ranked, redirect_sources

    def _promoted_scrs(self, ranked: List[dict], promotion_facets: List[str]):
        """Return Top-1 plus independently supported secondary SCRs.

        Design-8 preserves the Design-7 Top-1 path but changes secondary
        discovery.  Each unclaimed mechanism facet gets its own local candidate
        search across the ranked active SCR set.  A secondary must have
        facet-specific semantic evidence plus either rare/specific canonical
        trigger evidence or curated-context support.  Generic lexical overlap
        alone is not sufficient.
        """
        if not ranked:
            return [], {}
        top=ranked[0]
        promoted=[top["sid"]]
        promoted_set={top["sid"]}
        trace={top["sid"]:{"path":"PRIMARY","facet_index":None}}
        claimed_facets=set()
        if len(promotion_facets)>=2 and top.get("promotion_facet_scores"):
            vals=top["promotion_facet_scores"]
            # The primary always claims its strongest mechanism facet.
            strongest=max(range(len(vals)),key=lambda i:vals[i])
            claimed_facets.add(strongest)
            # It may also claim another facet when its canonical mechanism
            # evidence is itself specific and no alternative has a materially
            # stronger facet-specific case.  This prevents artificial
            # multi-label output merely because a sentence contains several
            # clauses that are all explained by the same primary SCR.
            for idx,top_facet in enumerate(vals):
                if idx==strongest or top_facet < self.cfg.promotion_independent_min_facet_score:
                    continue
                top_lex=top.get("promotion_lexical",[])
                tl=(top_lex[idx] if idx < len(top_lex) else (0,0.0,0,0.0,[]))
                _,_,top_rare,top_idf,_=tl
                top_specific=(top_rare>=1 or top_idf>=0.15)
                if not top_specific:
                    continue
                best_alt_score=0.0; best_alt_idf=0.0
                for r in ranked[1:]:
                    rvals=r.get("promotion_facet_scores",[])
                    if idx>=len(rvals): continue
                    lex=r.get("promotion_lexical",[])
                    rl=(lex[idx] if idx < len(lex) else (0,0.0,0,0.0,[]))
                    _,_,rrare,ridf,_=rl
                    if not (rrare>=1 or ridf>=0.15 or r["context_score"]>=self.cfg.promotion_independent_context_floor):
                        continue
                    if rvals[idx] > best_alt_score:
                        best_alt_score=rvals[idx]; best_alt_idf=ridf
                if (best_alt_score<=0 or
                    (top_facet >= best_alt_score-0.02 and top_idf >= 0.75*best_alt_idf)):
                    claimed_facets.add(idx)

        # Path A: preserve the validated strong-context path.
        for r in ranked[1:self.cfg.promotion_candidate_pool]:
            if len(promoted)>=self.cfg.promotion_max: break
            if r.get("negation_veto"):
                continue
            if (r["evidence_tier"] >= self.cfg.promotion_min_evidence_tier
                and r["mechanism_max"] >= self.cfg.min_context_supported_mechanism_score
                and top["weighted_score"] - r["weighted_score"] <= self.cfg.promotion_score_margin):
                promoted.append(r["sid"]); promoted_set.add(r["sid"])
                pidx=None
                if len(promotion_facets)>=2 and r.get("promotion_facet_scores"):
                    vals=r["promotion_facet_scores"]
                    pidx=max(range(len(vals)),key=lambda i:vals[i]); claimed_facets.add(pidx)
                trace[r["sid"]]={"path":"STRONG_CONTEXT","facet_index":pidx,"context_score":r["context_score"]}

        # Path B: facet-local discovery.  The candidate need not be in the
        # global Top-10 because a narrow secondary mechanism can be diluted in
        # the whole-profile score.
        if len(promotion_facets)>=2 and len(promoted)<self.cfg.promotion_max:
            for idx,facet in enumerate(promotion_facets):
                if len(promoted)>=self.cfg.promotion_max: break
                if idx in claimed_facets: continue
                topvals=top.get("promotion_facet_scores",[])
                top_facet=topvals[idx] if idx < len(topvals) else 0.0
                facet_pool=[]
                for raw_rank,r in enumerate(ranked[1:],start=2):
                    if r["sid"] in promoted_set: continue
                    vals=r.get("promotion_facet_scores",[])
                    if idx>=len(vals): continue
                    fscore=vals[idx]
                    facet_pool.append((fscore,-raw_rank,r))
                facet_pool=sorted(facet_pool,reverse=True,key=lambda x:(x[0],x[1]))[:self.cfg.promotion_facet_local_top_k]
                eligible=[]
                for fscore,neg_rank,r in facet_pool:
                    if r.get("negation_veto"):
                        continue
                    vals=r.get("promotion_facet_scores",[])
                    # The facet must be one of this SCR's own strongest clause
                    # matches, not incidental similarity.
                    if fscore < 0.93*max(vals): continue
                    if fscore < self.cfg.promotion_independent_min_facet_score: continue
                    if r["weighted_score"] < self.cfg.promotion_independent_weighted_ratio*top["weighted_score"]: continue
                    if top["weighted_score"] - r["weighted_score"] > self.cfg.promotion_independent_score_margin: continue

                    lex=r.get("promotion_lexical",[])
                    lcount,lscore,rare_count,idf_score,shared=(lex[idx] if idx < len(lex) else (0,0.0,0,0.0,[]))
                    top_lex=top.get("promotion_lexical",[])
                    tl=(top_lex[idx] if idx < len(top_lex) else (0,0.0,0,0.0,[]))
                    top_lcount,top_lscore,top_rare,top_idf,_=tl

                    # Structural/context support can justify a paraphrase even
                    # when literal overlap is sparse.  Otherwise require at
                    # least one rare canonical cue or sufficiently strong
                    # IDF-weighted overlap.
                    context_specific=(r["context_score"] >= self.cfg.promotion_independent_context_floor)
                    lexical_specific=(rare_count>=1 and idf_score>=self.cfg.promotion_specific_min_idf_score)
                    lexical_specific=lexical_specific or (lcount>=2 and idf_score>=1.5*self.cfg.promotion_specific_min_idf_score)
                    if not (context_specific or lexical_specific): continue

                    semantic_gain=(fscore-top_facet >= self.cfg.promotion_independent_facet_advantage)
                    relative_gain=(top_facet<=0 or fscore >= self.cfg.promotion_independent_facet_ratio_over_primary*top_facet)
                    specificity_gain=(rare_count>top_rare or idf_score>=top_idf+0.025 or context_specific)
                    if not ((semantic_gain and relative_gain and specificity_gain) or
                            (context_specific and fscore>=top_facet+0.015)): continue

                    scorekey=(rare_count, idf_score, 1 if context_specific else 0, fscore, r["weighted_score"], neg_rank)
                    eligible.append((scorekey,r,{
                        "path":"INDEPENDENT_FACET",
                        "facet_index":idx,
                        "facet_text":facet,
                        "facet_score":fscore,
                        "top_facet_score":top_facet,
                        "context_score":r["context_score"],
                        "lexical_match_count":lcount,
                        "rare_match_count":rare_count,
                        "idf_score":idf_score,
                        "shared_tokens":shared
                    }))
                if eligible:
                    _,r,tr=max(eligible,key=lambda x:x[0])
                    promoted.append(r["sid"]); promoted_set.add(r["sid"]); claimed_facets.add(idx); trace[r["sid"]]=tr
        return promoted, trace

    def predict(self, case: dict) -> dict:
        at, aid = case["Anchor_Type"], case["Anchor_ID"]
        scope_flag = "OK"
        semantic_rank = []

        if at == "Semantic":
            rt, rid, rscore, kids, semantic_rank = self._semantic_resolve(case)
            resolution_type, resolution_id = rt, rid
            selected_kcrs = kids
        else:
            resolution_type, resolution_id = at, aid
            all_k = self._scope_kcrs(at, aid)

            if at in ("Module", "Course") and all_k:
                q = (
                    case["Technical_Query"] + " " +
                    case["Application_Context"]
                ).strip()
                sc = self.backend.similarity(q, all_k)
                selected_kcrs = [
                    k for k, _ in sorted(
                        sc.items(), key=lambda x: x[1], reverse=True
                    )[:self.cfg.technical_scope_top_k]
                ]
            else:
                selected_kcrs = all_k

        mismatch, best_sibling, best_sibling_score, direct_score = (
            self._scope_mismatch(
                case, selected_kcrs if at == "Subtopic" else []
            )
        )
        if mismatch:
            scope_flag = "SCOPE_MISMATCH_REANCHOR"

        evidence_nodes = self._enrich_kcrs(selected_kcrs)
        if at == "Semantic":
            evidence_nodes = sorted(set(
                evidence_nodes
                + [x[0] for x in semantic_rank[:self.cfg.semantic_anchor_top_k]]
            ))

        facets = self._mechanism_facets(case)
        promotion_facets = self._promotion_facets(case)
        negative_promotion_facets = self._negative_promotion_facets(case)
        context_scores = self._context_scores(case, facets)
        top_contexts = sorted(
            context_scores.items(), key=lambda x: x[1], reverse=True
        )[:self.cfg.context_top_k]

        mechanism_present = str(
            case.get("Sustainability_Mechanism_Present", "")
        ).lower() in ("yes", "true", "1")

        candidate_rows = []
        raw_candidate_rows = []
        rec = ""
        rec_name = ""
        promoted = []
        promotion_trace = {}