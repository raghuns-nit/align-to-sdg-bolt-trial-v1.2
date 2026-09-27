import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'
import { Save, FileText, Clock } from 'lucide-react'

interface HistoryItem { event_id: string; decision_status: string; recommended_scr_id: string; recommended_scr_name: string; promoted_scr_ids: string; created_at: string; application_context_summary: string; is_saved: boolean; kit_id: string | null; kit_status: string | null }

export default function MyHistory() {
  const { user } = useAuth()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'saved'>('all')
  const [search, setSearch] = useState('')

  useEffect(() => { if (user) loadHistory() }, [user])

  async function loadHistory() {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('recommendation_events').select(`id, decision_status, recommended_scr_id, recommended_scr_name, promoted_scr_ids, created_at, snapshot_id, recommendation_context_snapshots!inner(course_id, module_id, subtopic_id, application_context_summary)`).eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) { setLoading(false); return }
    const { data: savedData } = await supabase.from('saved_items').select('event_id').eq('user_id', user.id)
    const savedSet = new Set((savedData || []).map((s) => s.event_id))
    const { data: kitData } = await supabase.from('educator_kit_snapshots').select('id, event_id, validation_status').eq('user_id', user.id)
    const kitMap = new Map((kitData || []).map((k) => [k.event_id, { id: k.id, status: k.validation_status }]))
    setItems((data || []).map((row: any) => ({ event_id: row.id, decision_status: row.decision_status, recommended_scr_id: row.recommended_scr_id, recommended_scr_name: row.recommended_scr_name, promoted_scr_ids: row.promoted_scr_ids, created_at: row.created_at, application_context_summary: row.recommendation_context_snapshots?.application_context_summary || '', is_saved: savedSet.has(row.id), kit_id: kitMap.get(row.id)?.id || null, kit_status: kitMap.get(row.id)?.status || null })))
    setLoading(false)
  }

  const filtered = items.filter((item) => { if (filter === 'saved' && !item.is_saved) return false; if (search) { const q = search.toLowerCase(); return item.recommended_scr_name?.toLowerCase().includes(q) || item.application_context_summary?.toLowerCase().includes(q) || item.decision_status.toLowerCase().includes(q) } return true })

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="loading-spinner" /></div>

  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>My History</h1>
      <p style={{ color: 'var(--color-neutral-500)', marginBottom: '1.5rem' }}>Your recommendation history. Items are stored as immutable snapshots and do not recompute when viewed.</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('all')}>All</button>
        <button className={`btn ${filter === 'saved' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('saved')}><Save size={14} /> Saved</button>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? <div className="card" style={{ textAlign: 'center', padding: '2rem' }}><Clock size={32} style={{ color: 'var(--color-neutral-300)', marginBottom: 8 }} /><p style={{ color: 'var(--color-neutral-500)' }}>No recommendations yet. Create one to get started.</p><Link to="/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Recommendation</Link></div>
      : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{filtered.map((item) => <div key={item.event_id} className="card" style={{ padding: '1rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><div><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{item.decision_status === 'RECOMMENDED_HYBRID_EVIDENCE' ? <span className="badge badge-success">Recommended</span> : <span className="badge badge-warning">Abstained</span>}{item.is_saved && <span className="badge badge-primary"><Save size={10} style={{ display: 'inline' }} /> Saved</span>}{item.kit_status === 'READY' && <span className="badge badge-success">Kit Ready</span>}</div>{item.recommended_scr_name && <div style={{ fontWeight: 500, marginTop: 4 }}>{item.recommended_scr_name}</div>}<div style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-500)', marginTop: 2 }}>{new Date(item.created_at).toLocaleString()}</div>{item.application_context_summary && <div style={{ fontSize: '0.8125rem', color: 'var(--color-neutral-500)', marginTop: 4, maxWidth: 500 }}>{item.application_context_summary.slice(0, 120)}{item.application_context_summary.length > 120 ? '...' : ''}</div>}</div>{item.kit_id && <Link to={`/kit/${item.kit_id}`} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}><FileText size={12} /> View Kit</Link>}</div></div>)}</div>}
    </div>
  )
}
