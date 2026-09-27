import type {
  Course, Module, Subtopic, KCR, KPR, KFR, SCR, Guardrail,
  ApplicationContext, SDGGoal, SDGTarget, SDGIndicator,
  ESDObjective, ESDCompetency, CFKnowledge, CFSkill, CFValue, CFCompetency, Relationship,
} from '../types/domain'
import { parseCSV, getRelationshipFields, joinText } from './csv-parser'

export interface RepositoryData {
  courses: Course[]; modules: Module[]; subtopics: Subtopic[]
  kcrs: KCR[]; kprs: KPR[]; kfrs: KFR[]; scrs: SCR[]; guardrails: Guardrail[]
  contexts: ApplicationContext[]; sdgGoals: SDGGoal[]; sdgTargets: SDGTarget[]
  sdgIndicators: SDGIndicator[]; esdObjectives: ESDObjective[]; esdCompetencies: ESDCompetency[]
  cfKnowledge: CFKnowledge[]; cfSkills: CFSkill[]; cfValues: CFValue[]; cfCompetencies: CFCompetency[]
  relationships: Relationship[]
  courseById: Map<string, Course>; moduleById: Map<string, Module>; subtopicById: Map<string, Subtopic>
  kcrById: Map<string, KCR>; kprById: Map<string, KPR>; kfrById: Map<string, KFR>
  scrById: Map<string, SCR>; contextById: Map<string, ApplicationContext>
  outEdges: Map<string, [string, string][]>; inEdges: Map<string, [string, string][]>
  texts: Map<string, string>; types: Map<string, string>
  allScrIds: string[]; activeScrIds: string[]; contextIds: string[]
  mergeMap: Map<string, string>; contextSupports: Map<string, string[]>
}

export function buildRepository(files: Record<string, string>): RepositoryData {
  const parse = (key: string) => {
    const parsed = parseCSV(files[key])
    return parsed.rows.map((row) => {
      const normalized: Record<string, string> = {}
      for (const [k, v] of Object.entries(row)) {
        const cleanKey = k.replace(/:ID$|:LABEL$/, '')
        normalized[cleanKey] = v
      }
      return normalized
    })
  }

  const courses = parse('course') as unknown as Course[]
  const modules = parse('module') as unknown as Module[]
  const subtopics = parse('subtopic') as unknown as Subtopic[]
  const kcrs = parse('kcr') as unknown as KCR[]
  const kprs = parse('kpr') as unknown as KPR[]
  const kfrs = parse('kfr') as unknown as KFR[]
  const scrs = parse('scr') as unknown as SCR[]
  const guardrails = parse('guardrail') as unknown as Guardrail[]
  const contexts = parse('context') as unknown as ApplicationContext[]
  const sdgGoals = parse('sdgGoal') as unknown as SDGGoal[]
  const sdgTargets = parse('sdgTarget') as unknown as SDGTarget[]
  const sdgIndicators = parse('sdgIndicator') as unknown as SDGIndicator[]
  const esdObjectives = parse('esdObjective') as unknown as ESDObjective[]
  const esdCompetencies = parse('esdCompetency') as unknown as ESDCompetency[]
  const cfKnowledge = parse('cfKnowledge') as unknown as CFKnowledge[]
  const cfSkills = parse('cfSkill') as unknown as CFSkill[]
  const cfValues = parse('cfValue') as unknown as CFValue[]
  const cfCompetencies = parse('cfCompetency') as unknown as CFCompetency[]

  const relParsed = parseCSV(files['relationships'])
  const relFields = getRelationshipFields(relParsed.headers)
  const relationships: Relationship[] = relFields
    ? relParsed.rows.map((r) => ({ start_id: r[relFields.startField], end_id: r[relFields.endField], type: r[relFields.typeField] }))
    : []

  const courseById = new Map(courses.map((r) => [r.course_id, r]))
  const moduleById = new Map(modules.map((r) => [r.module_id, r]))
  const subtopicById = new Map(subtopics.map((r) => [r.subtopic_id, r]))
  const kcrById = new Map(kcrs.map((r) => [r.kcr_id, r]))
  const kprById = new Map(kprs.map((r) => [r.kpr_id, r]))
  const kfrById = new Map(kfrs.map((r) => [r.kfr_id, r]))
  const scrById = new Map(scrs.map((r) => [r.scr_id, r]))
  const contextById = new Map(contexts.map((r) => [r.application_context_id, r]))

  const outEdges = new Map<string, [string, string][]>()
  const inEdges = new Map<string, [string, string][]>()
  for (const rel of relationships) {
    if (!outEdges.has(rel.start_id)) outEdges.set(rel.start_id, [])
    outEdges.get(rel.start_id)!.push([rel.type, rel.end_id])
    if (!inEdges.has(rel.end_id)) inEdges.set(rel.end_id, [])
    inEdges.get(rel.end_id)!.push([rel.type, rel.start_id])
  }

  const texts = new Map<string, string>()
  const types = new Map<string, string>()
  const corpusSets: [Record<string, string>[], string, string, string[]][] = [
    [courses as any, 'course_id', 'Course', ['title', 'description', 'objectives', 'learning_outcomes']],
    [modules as any, 'module_id', 'Module', ['name', 'description']],
    [subtopics as any, 'subtopic_id', 'Subtopic', ['name', 'description']],
    [kcrs as any, 'kcr_id', 'KCR', ['name', 'definition', 'scope', 'core_principles', 'semantic_description', 'keywords_synonyms']],
    [kprs as any, 'kpr_id', 'KPR', ['name', 'definition', 'scope', 'core_ideas', 'semantic_description', 'keywords_synonyms']],
    [kfrs as any, 'kfr_id', 'KFR', ['name', 'definition', 'scope', 'purpose', 'inputs', 'outputs', 'realization_or_mechanism', 'semantic_description', 'keywords_synonyms']],
    [scrs as any, 'scr_id', 'SCR', ['name', 'definition', 'scope', 'core_ideas', 'semantic_description', 'keywords_synonyms', 'sustainability_principle', 'underlying_mechanism', 'boundary_conditions', 'recommendation_trigger']],
    [contexts as any, 'application_context_id', 'ApplicationContext', ['name', 'description', 'technical_problem', 'operational_action', 'mechanism', 'sustainability_outcome', 'boundary_conditions', 'keywords_synonyms']],
  ]
  for (const [rows, idField, type, fields] of corpusSets) {
    for (const row of rows) { const id = row[idField]; texts.set(id, joinText(row, fields)); types.set(id, type) }
  }

  const allScrIds = scrs.map((r) => r.scr_id)
  const activeScrIds = scrs.filter((r) => r.status === 'Active').map((r) => r.scr_id)
  const contextIds = contexts.filter((r) => r.status === 'Active').map((r) => r.application_context_id)

  const mergeMap = new Map<string, string>()
  for (const sid of allScrIds) {
    for (const [tp, t] of outEdges.get(sid) || []) { if (tp === 'MERGED_INTO') mergeMap.set(sid, t) }
  }

  const contextSupports = new Map<string, string[]>()
  for (const cid of contextIds) {
    const supports: string[] = []
    for (const [tp, target] of outEdges.get(cid) || []) {
      if (tp === 'EVIDENCE_SUPPORTS') {
        let resolvedTarget = mergeMap.has(target) ? mergeMap.get(target)! : target
        const scr = scrById.get(resolvedTarget)
        if (scr && scr.status === 'Active') supports.push(resolvedTarget)
      }
    }
    if (supports.length > 0) contextSupports.set(cid, supports)
  }

  return {
    courses, modules, subtopics, kcrs, kprs, kfrs, scrs, guardrails, contexts,
    sdgGoals, sdgTargets, sdgIndicators, esdObjectives, esdCompetencies,
    cfKnowledge, cfSkills, cfValues, cfCompetencies, relationships,
    courseById, moduleById, subtopicById, kcrById, kprById, kfrById, scrById, contextById,
    outEdges, inEdges, texts, types, allScrIds, activeScrIds, contextIds, mergeMap, contextSupports,
  }
}
