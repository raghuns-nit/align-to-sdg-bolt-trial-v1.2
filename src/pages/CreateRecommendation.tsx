import { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth-context'
import { loadRepositoryData } from '../lib/repo-loader'
import { Design8aRuntime } from '../engine/recommendation'
import { resolveTemplate, generateKitContent, validateKit } from '../lib/kit'
import { supabase } from '../lib/supabase'
import { REPOSITORY_VERSION } from '../engine/config'
import type { RepositoryData } from '../engine/repository'
import type { RecommendationRequest, RecommendationResult, TopCandidate } from '../types/domain'
import { Save, FileText, AlertCircle, CheckCircle, XCircle, ChevronRight } from 'lucide-react'

type Step = 'curriculum' | 'context' | 'teaching' | 'result'

export default function CreateRecommendation() {
  const { user } = useAuth()
  const [repo, setRepo] = useState<RepositoryData | null>(null)
  const [runtime, setRuntime] = useState<Design8aRuntime | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('curriculum')
  const [courseId, setCourseId] = useState(''); const [moduleId, setModuleId] = useState(''); const [subtopicId, setSubtopicId] = useState('')
  const [technicalQuery, setTechnicalQuery] = useState(''); const [applicationContext, setApplicationContext] = useState('')
  const [contextSource, setContextSource] = useState<'EDUCATOR_ENTERED' | 'ACCEPTED_SYSTEM_GENERATED'>('EDUCATOR_ENTERED')
  const [acceptedContextId, setAcceptedContextId] = useState('')
  const [mechanism, setMechanism] = useState(''); const [operationalAction, setOperationalAction] = useState('')
  const [sustainabilityMechanismPresent, setSustainabilityMechanismPresent] = useState('yes')
  const [teachingContext, setTeachingContext] = useState({ class_size: '', session_duration: '', assessment_preference: '', activity_format: '', pedagogical_approach: '' })
  const [result, setResult] = useState<RecommendationResult | null>(null)
  const [resultError, setResultError] = useState(''); const [kitSnapshotId, setKitSnapshotId] = useState<string | null>(null)
  const [kitValidationStatus, setKitValidationStatus] = useState(''); const [saved, setSaved] = useState(false); const [running, setRunning] = useState(false)
  const [contextSuggestions, setContextSuggestions] = useState<{ id: string; name: string; score: number }[]>([])

  useEffect(() => {
    loadRepositoryData().then((r) => { setRepo(r); setRuntime(new Design8aRuntime(r)); setLoading(false) }).catch((err) => { setResultError(`Failed to load repository: ${err.message}`); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!runtime || !repo) return
    const query = `${technicalQuery} ${applicationContext} ${mechanism} ${operationalAction}`.trim()
    if (!query) { setContextSuggestions([]); return }
    const scores = runtime['backend'].similarity(query, repo.contextIds)
    setContextSuggestions(Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, score]) => ({ id, name: repo.contextById.get(id)?.name || id, score })))
  }, [technicalQuery, applicationContext, mechanism, operationalAction, runtime, repo])

  const modules = repo?.modules.filter((m) => courseId && repo.outEdges.get(courseId)?.some(([tp, t]) => tp === 'CONTAINS_MODULE' && t === m.module_id)) || []
  const subtopics = repo?.subtopics.filter((s) => moduleId && repo.outEdges.get(moduleId)?.some(([tp, t]) => tp === 'CONTAINS_SUBTOPIC' && t === s.subtopic_id)) || []

  function acceptContext(id: string) { const ctx = repo?.contextById.get(id); if (ctx) { setApplicationContext(ctx.name + ' — ' + (ctx.description || '')); setContextSource('ACCEPTED_SYSTEM_GENERATED'); setAcceptedContextId(id) } }

  async function runRecommendation() {
    if (!runtime || !repo || !user) return
    setRunning(true); setResultError(''); setResult(null); setKitSnapshotId(null); setSaved(false)
    try {
      const req: RecommendationRequest = {
        test_id: `UI-${Date.now()}`, test_dimension: 'EDUCATOR_INPUT', anchor_type: 'Subtopic', anchor_id: subtopicId,
        course_hint: courseId, technical_query: technicalQuery, application_context: applicationContext,
        technical_system: '', operational_action: operationalAction, mechanism,
        affected_resource_or_function: '', stakeholder_or_ecological_context: '', boundary_conditions: '',
        sustainability_mechanism_present: sustainabilityMechanismPresent, application_context_source: contextSource,
        accepted_context_id: acceptedContextId, teaching_context: teachingContext,
      }
      const res = runtime.predict(req); setResult(res)
      const { data: snapshotData } = await supabase.from('recommendation_context_snapshots').insert({ user_id: user.id, request_json: req as any, course_id: courseId, module_id: moduleId, subtopic_id: subtopicId, application_context_summary: applicationContext, application_context_source: contextSource, teaching_context_json: teachingContext as any, repository_version: REPOSITORY_VERSION }).select('id').single()
      const { data: eventData } = await supabase.from('recommendation_events').insert({ user_id: user.id, snapshot_id: snapshotData?.id, decision_status: res.decision_status, recommended_scr_id: res.recommended_scr_id, recommended_scr_name: res.recommended_scr_name, promoted_scr_ids: res.promoted_scr_ids, result_json: res as any, repository_version: REPOSITORY_VERSION }).select('id').single()
      if (res.decision_status === 'RECOMMENDED_HYBRID_EVIDENCE' && res.recommended_scr_id && eventData) {
        const scr = repo.scrById.get(res.recommended_scr_id); const template = resolveTemplate(res.recommended_scr_id)
        const kitContent = generateKitContent(res, scr, template, teachingContext); const validationReport = validateKit(kitContent)
        const { data: kitData } = await supabase.from('educator_kit_snapshots').insert({ user_id: user.id, event_id: eventData.id, template_id: template.template_id, template_name: template.template_name, scr_id: res.recommended_scr_id, scr_name: res.recommended_scr_name, kit_content_json: kitContent as any, validation_status: validationReport.status, validation_report_json: validationReport as any }).select('id').single()
        setKitSnapshotId(kitData?.id || null); setKitValidationStatus(validationReport.status)
      }
      setStep('result')
    } catch (err: any) {
      setResultError(err.message || 'Recommendation failed')
      await supabase.from('audit_events').insert({ user_id: user.id, event_type: 'TECHNICAL_ERROR', event_data: { error: err.message } as any })
    } finally { setRunning(false) }
  }

  async function saveForLater() {
    if (!user || !result) return
    try {
      const { data: events } = await supabase.from('recommendation_events').select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
      if (!events || events.length === 0) return
      const eventId = events[0].id
      await supabase.from('educator_decisions').insert({ user_id: user.id, event_id: eventId, kit_snapshot_id: kitSnapshotId, decision_type: 'SAVE_FOR_LATER' })
      await supabase.from('saved_items').insert({ user_id: user.id, event_id: eventId })
      setSaved(true)
    } catch (err: any) { setResultError(`Failed to save: ${err.message}`) }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="loading-spinner" /></div>
  if (!repo || !runtime) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-error-600)' }}>Failed to load repository data.</div>
  const candidates: TopCandidate[] = result ? JSON.parse(result.top_candidates_json) : []

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Create a Recommendation</h1>
      <p style={{ color: 'var(--color-neutral-500)', marginBottom: '1.5rem' }}>Select your curriculum anchor, describe your teaching context, and receive a sustainability curriculum recommendation.</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['curriculum','context','teaching','result'] as Step[]).map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, background: step === s ? 'var(--color-primary-600)' : 'var(--color-neutral-200)', color: step === s ? 'white' : 'var(--color-neutral-500)' }}>{i + 1}</div>
            <span style={{ fontSize: '0.8125rem', color: step === s ? 'var(--color-primary-700)' : 'var(--color-neutral-400)' }}>{s === 'curriculum' ? 'Curriculum' : s === 'context' ? 'Context' : s === 'teaching' ? 'Teaching' : 'Result'}</span>
            {i < 3 && <ChevronRight size={14} style={{ color: 'var(--color-neutral-300)' }} />}
          </div>
        ))}
      </div>

      {step === 'curriculum' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Select Curriculum Anchor</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)', marginBottom: '1rem' }}>Choose Course, then Module, then Subtopic. The subtopic is the authoritative anchor for the recommendation.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Course</label><select className="select" value={courseId} onChange={(e) => { setCourseId(e.target.value); setModuleId(''); setSubtopicId('') }}><option value="">Select a course...</option>{repo.courses.filter((c) => c.status === 'Active').map((c) => <option key={c.course_id} value={c.course_id}>{c.title}</option>)}</select></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Module</label><select className="select" value={moduleId} onChange={(e) => { setModuleId(e.target.value); setSubtopicId('') }} disabled={!courseId}><option value="">Select a module...</option>{modules.map((m) => <option key={m.module_id} value={m.module_id}>{m.name}</option>)}</select></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Subtopic</label><select className="select" value={subtopicId} onChange={(e) => setSubtopicId(e.target.value)} disabled={!moduleId}><option value="">Select a subtopic...</option>{subtopics.map((s) => <option key={s.subtopic_id} value={s.subtopic_id}>{s.name}</option>)}</select></div>
            <button className="btn btn-primary" onClick={() => setStep('context')} disabled={!subtopicId}>Continue</button>
          </div>
        </div>
      )}

      {step === 'context' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Application Context</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)', marginBottom: '1rem' }}>Describe the teaching scenario. You can enter your own context or accept a system-generated suggestion.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Technical Query</label><input className="input" value={technicalQuery} onChange={(e) => setTechnicalQuery(e.target.value)} placeholder="e.g., water treatment, supply chain logistics" /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Application Context</label><textarea className="textarea" rows={3} value={applicationContext} onChange={(e) => { setApplicationContext(e.target.value); setContextSource('EDUCATOR_ENTERED') }} placeholder="Describe the application context..." /></div>
            {contextSuggestions.length > 0 && <div><p style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-500)', marginBottom: 4 }}>System-generated context suggestions:</p>{contextSuggestions.map((s) => <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid var(--color-neutral-200)', borderRadius: 'var(--radius-md)', marginBottom: 4 }}><span style={{ fontSize: '0.875rem' }}>{s.name}</span><button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }} onClick={() => acceptContext(s.id)}>Accept</button></div>)}</div>}
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Mechanism</label><textarea className="textarea" rows={2} value={mechanism} onChange={(e) => setMechanism(e.target.value)} placeholder="Describe the sustainability mechanism..." /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Operational Action</label><input className="input" value={operationalAction} onChange={(e) => setOperationalAction(e.target.value)} placeholder="e.g., reduce, monitor, assess" /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Is a sustainability mechanism present?</label><select className="select" value={sustainabilityMechanismPresent} onChange={(e) => setSustainabilityMechanismPresent(e.target.value)}><option value="yes">Yes</option><option value="no">No</option></select></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}><button className="btn btn-secondary" onClick={() => setStep('curriculum')}>Back</button><button className="btn btn-primary" onClick={() => setStep('teaching')}>Continue</button></div>
          </div>
        </div>
      )}

      {step === 'teaching' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Teaching Context (Optional)</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)', marginBottom: '1rem' }}>Teaching context influences pedagogical fit and Kit presentation. It does NOT change recommendation eligibility.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Class Size</label><input className="input" value={teachingContext.class_size} onChange={(e) => setTeachingContext({ ...teachingContext, class_size: e.target.value })} placeholder="e.g., 30 students" /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Session Duration</label><input className="input" value={teachingContext.session_duration} onChange={(e) => setTeachingContext({ ...teachingContext, session_duration: e.target.value })} placeholder="e.g., 90 minutes" /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Assessment Preference</label><input className="input" value={teachingContext.assessment_preference} onChange={(e) => setTeachingContext({ ...teachingContext, assessment_preference: e.target.value })} placeholder="e.g., project-based, exam" /></div>
            <div><label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: 4 }}>Activity Format</label><input className="input" value={teachingContext.activity_format} onChange={(e) => setTeachingContext({ ...teachingContext, activity_format: e.target.value })} placeholder="e.g., group discussion, lab" /></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}><button className="btn btn-secondary" onClick={() => setStep('context')}>Back</button><button className="btn btn-primary" onClick={runRecommendation} disabled={running}>{running ? <><span className="loading-spinner" /> Generating...</> : 'Generate Recommendation'}</button></div>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {resultError && <div className="card" style={{ borderColor: 'var(--color-error-500)' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><XCircle size={20} style={{ color: 'var(--color-error-600)' }} /><span style={{ fontWeight: 500, color: 'var(--color-error-700)' }}>Technical Error</span></div><p style={{ marginTop: '0.5rem', color: 'var(--color-error-600)' }}>{resultError}</p><button className="btn btn-secondary" onClick={() => setStep('teaching')} style={{ marginTop: '0.5rem' }}>Back</button></div>}
          {result && <>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h3>Recommendation Result</h3><div style={{ marginTop: '0.5rem' }}>{result.decision_status === 'RECOMMENDED_HYBRID_EVIDENCE' ? <span className="badge badge-success"><CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />Recommended</span> : result.decision_status.startsWith('ABSTAIN') ? <span className="badge badge-warning"><AlertCircle size={12} style={{ display: 'inline', marginRight: 4 }} />Abstained: {result.decision_status.replace('ABSTAIN_', '').replace(/_/g, ' ')}</span> : <span className="badge badge-neutral">{result.decision_status}</span>}</div></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)', textAlign: 'right' }}><div>Backend: {result.semantic_backend}</div><div>Dimension: {result.embedding_dimension}</div></div>
              </div>
              {result.recommended_scr_id && <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)' }}><div style={{ fontSize: '0.8125rem', color: 'var(--color-primary-600)', fontWeight: 500 }}>Primary Recommendation</div><div style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: 2 }}>{result.recommended_scr_name}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)', marginTop: 2 }}>{result.recommended_scr_id}</div>{result.promoted_scr_ids && result.promoted_scr_ids !== result.recommended_scr_id && <div style={{ marginTop: '0.5rem' }}><span style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-500)' }}>Also promoted: </span><span style={{ fontSize: '0.8125rem' }}>{result.promoted_scr_ids.split('; ').filter((s) => s !== result.recommended_scr_id).join(', ')}</span></div>}</div>}
              {result.decision_status.startsWith('ABSTAIN') && <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--color-warning-50)', borderRadius: 'var(--radius-md)' }}><p style={{ fontSize: '0.875rem', color: 'var(--color-warning-700)' }}>{result.decision_status === 'ABSTAIN_NO_SUSTAINABILITY_MECHANISM' ? 'No sustainability mechanism was identified in the input. The system cannot make a recommendation without a defensible mechanism.' : result.decision_status === 'ABSTAIN_SCOPE_MISMATCH_REANCHOR' ? 'The selected subtopic scope does not match the described context well enough to make a confident recommendation.' : 'Insufficient evidence was found to make a confident recommendation for this input.'}</p></div>}
            </div>
            {candidates.length > 0 && <div className="card"><h4 style={{ marginBottom: '0.75rem' }}>Top Candidates</h4><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}><thead><tr style={{ borderBottom: '1px solid var(--color-neutral-200)' }}><th style={{ textAlign: 'left', padding: '0.5rem' }}>Rank</th><th style={{ textAlign: 'left', padding: '0.5rem' }}>SCR</th><th style={{ textAlign: 'right', padding: '0.5rem' }}>Score</th><th style={{ textAlign: 'right', padding: '0.5rem' }}>Mechanism</th><th style={{ textAlign: 'left', padding: '0.5rem' }}>Path</th><th style={{ textAlign: 'left', padding: '0.5rem' }}>Veto</th></tr></thead><tbody>{candidates.map((c) => <tr key={c.scr_id} style={{ borderBottom: '1px solid var(--color-neutral-100)' }}><td style={{ padding: '0.5rem' }}>{c.rank}</td><td style={{ padding: '0.5rem' }}>{c.scr_name}</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{c.semantic_score.toFixed(4)}</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{c.mechanism_facet_max.toFixed(4)}</td><td style={{ padding: '0.5rem', fontSize: '0.75rem' }}>{c.promotion_path || '-'}</td><td style={{ padding: '0.5rem' }}>{c.negation_veto === 'YES' ? <span className="badge badge-error">VETO</span> : '-'}</td></tr>)}</tbody></table></div></div>}
            {kitSnapshotId && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4>Educator Kit</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-500)', marginTop: 4 }}>{kitValidationStatus === 'READY' ? 'Kit generated and validated successfully.' : 'Kit validation failed — some required elements are incomplete.'}</p>
              </div>
              <div>{kitValidationStatus === 'READY' ? <span className="badge badge-success">READY</span> : <span className="badge badge-error">VALIDATION FAILED</span>}</div>
            </div>
            {kitValidationStatus === 'READY' && <a href={`/kit/${kitSnapshotId}`} className="btn btn-outline" style={{ marginTop: '0.75rem' }}><FileText size={15} /> View Kit</a>}
          </div>
        )}
            <div style={{ display: 'flex', gap: '0.5rem' }}><button className="btn btn-primary" onClick={saveForLater} disabled={saved}><Save size={15} /> {saved ? 'Saved' : 'Save for Later'}</button><button className="btn btn-secondary" onClick={() => { setStep('curriculum'); setResult(null); setSaved(false) }}>New Recommendation</button></div>
          </>}
        </div>
      )}
    </div>
  )
}
