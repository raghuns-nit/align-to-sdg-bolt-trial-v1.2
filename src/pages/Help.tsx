import { useState } from 'react'
import { BookOpen, Compass, Network, Clock, Shield, HelpCircle, Save } from 'lucide-react'

const SECTIONS = [
  { id: 'getting-started', title: 'Getting Started', icon: BookOpen, content: 'Welcome to Align To SDG. This system helps educators integrate sustainability concepts into higher-education curricula. To get started, sign in and click "Create" to begin a recommendation.' },
  { id: 'navigation', title: 'Navigation', icon: Compass, content: 'Use the header navigation to move between Home, Create Recommendation, My History, Knowledge Graph, and Help. Admin appears only for admin users.' },
  { id: 'create', title: 'Create a Recommendation', icon: Compass, content: 'Select Course -> Module -> Subtopic, then describe your application context. You can enter your own context or accept a system-generated suggestion. Optionally add teaching context. Click Generate to receive a recommendation.' },
  { id: 'app-context', title: 'Application Context', icon: HelpCircle, content: 'The application context describes the real-world scenario. Educator-entered context takes precedence over accepted system-generated context. The system generates compatible suggestions before ranking them.' },
  { id: 'teaching-context', title: 'Teaching Context', icon: HelpCircle, content: 'Teaching context (class size, duration, assessment preference, activity format) influences pedagogical fit and Kit presentation. It does NOT change recommendation eligibility or ranking.' },
  { id: 'result', title: 'Recommendation Result', icon: Compass, content: 'The result shows the primary recommended sustainability principle, any promoted secondary principles, top candidates with scores, and the decision status (Recommended or Abstained). Abstention is not an error — it means the system could not find sufficient evidence.' },
  { id: 'why', title: 'Why this recommendation?', icon: HelpCircle, content: 'The recommendation trace shows evidence tiers, mechanism scores, context support, and promotion paths. This is derived from persisted recommendation evidence, not independently regenerated.' },
  { id: 'kit', title: 'Educator Kit', icon: BookOpen, content: 'When a recommendation succeeds, an Educator Kit is generated from the immutable snapshot. The Kit contains the sustainability principle, mechanism, trigger, core ideas, boundary conditions, and pedagogical guidance. If validation fails, the Kit is not shown as READY.' },
  { id: 'save-history', title: 'Save for Later and My History', icon: Save, content: 'Save for Later persists an EducatorDecision and adds a bookmark. My History shows your past recommendations as immutable snapshots — viewing them does not rerun the recommendation engine.' },
  { id: 'kg-explorer', title: 'Knowledge Graph Explorer', icon: Network, content: 'The KG Explorer lets you browse the governed ontology graph, inspect entities and their relationships, and find shortest directed paths. It is read-only and independent from recommendation logic.' },
  { id: 'admin', title: 'Administration', icon: Shield, content: 'Admins can manage users (view, change roles, activate/deactivate). Repository data is read-only — admin does not permit canonical repository editing. Admin access is enforced server-side.' },
  { id: 'privacy', title: 'Data and Privacy', icon: HelpCircle, content: 'Your recommendation history is private to you. Other educators cannot see your history or saved items. Passwords are managed by the authentication provider and are never stored in application tables.' },
  { id: 'troubleshooting', title: 'Troubleshooting', icon: HelpCircle, content: 'If you see "Abstained", the system could not find sufficient evidence for a recommendation — try adjusting your context. If you see a Technical Error, this is an infrastructure issue, not a recommendation outcome.' },
]

export default function Help() {
  const [active, setActive] = useState('getting-started')
  const section = SECTIONS.find((s) => s.id === active)!
  return (
    <div className="fade-in">
      <h1 style={{ marginBottom: '0.5rem' }}>Help Center</h1>
      <p style={{ color: 'var(--color-neutral-500)', marginBottom: '1.5rem' }}>Learn how to use Align To SDG — navigation, features, workflows, and troubleshooting.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {SECTIONS.map((s) => { const Icon = s.icon; return <button key={s.id} onClick={() => setActive(s.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'left', fontSize: '0.875rem', background: active === s.id ? 'var(--color-primary-50)' : 'transparent', color: active === s.id ? 'var(--color-primary-700)' : 'var(--color-neutral-600)', border: 'none', cursor: 'pointer' }}><Icon size={14} />{s.title}</button> })}
        </div>
        <div className="card"><h3 style={{ marginBottom: '0.75rem' }}>{section.title}</h3><p style={{ color: 'var(--color-neutral-700)', lineHeight: 1.6 }}>{section.content}</p></div>
      </div>
    </div>
  )
}
