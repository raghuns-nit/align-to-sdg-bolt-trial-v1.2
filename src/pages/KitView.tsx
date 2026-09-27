import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FileText, CheckCircle, XCircle, Download } from 'lucide-react'

interface KitData { id: string; template_name: string; scr_name: string; scr_id: string; validation_status: string; kit_content_json: any; validation_report_json: any; created_at: string }

export default function KitView() {
  const { kitId } = useParams()
  const [kit, setKit] = useState<KitData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (!kitId) return; supabase.from('educator_kit_snapshots').select('*').eq('id', kitId).maybeSingle().then(({ data, error }) => { if (!error && data) setKit(data as KitData); setLoading(false) }) }, [kitId])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="loading-spinner" /></div>
  if (!kit) return <div style={{ padding: 40, textAlign: 'center' }}>Kit not found.</div>

  const content = kit.kit_content_json; const elements = content?.elements || []; const report = kit.validation_report_json

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div><h1 style={{ marginBottom: '0.25rem' }}><FileText size={20} style={{ display: 'inline', marginRight: 8 }} />Educator Kit</h1><p style={{ color: 'var(--color-neutral-500)', fontSize: '0.875rem' }}>{kit.template_name} — {kit.scr_name} ({kit.scr_id})</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>{kit.validation_status === 'READY' ? <span className="badge badge-success"><CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />READY</span> : <span className="badge badge-error"><XCircle size={12} style={{ display: 'inline', marginRight: 4 }} />VALIDATION FAILED</span>}<button className="btn btn-outline" onClick={() => window.print()}><Download size={14} /> Export PDF</button></div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)', marginBottom: '1rem' }}>Created: {new Date(kit.created_at).toLocaleString()} — This Kit is an immutable snapshot. Viewing it does not regenerate content.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {elements.map((elem: any, i: number) => { const check = report?.checks?.find((c: any) => c.element_id === elem.element_id); return <div key={i} className="card"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}><h4 style={{ margin: 0 }}>{elem.element_name}</h4>{check && (check.status === 'PASS' ? <CheckCircle size={16} style={{ color: 'var(--color-success-600)' }} /> : <XCircle size={16} style={{ color: 'var(--color-error-600)' }} />)}</div><p style={{ fontSize: '0.875rem', color: 'var(--color-neutral-700)', lineHeight: 1.6 }}>{elem.content || <span style={{ color: 'var(--color-error-500)' }}>[Incomplete]</span>}</p></div> })}
      </div>
    </div>
  )
}
