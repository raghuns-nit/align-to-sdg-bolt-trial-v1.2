import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from './lib/auth-context'
import { lazy, Suspense } from 'react'
import { BookOpen, Compass, Clock, Network, HelpCircle, Shield, LogOut } from 'lucide-react'

const Home = lazy(() => import('./pages/Home'))
const Auth = lazy(() => import('./pages/Auth'))
const CreateRecommendation = lazy(() => import('./pages/CreateRecommendation'))
const MyHistory = lazy(() => import('./pages/MyHistory'))
const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'))
const Help = lazy(() => import('./pages/Help'))
const Admin = lazy(() => import('./pages/Admin'))
const KitView = lazy(() => import('./pages/KitView'))

function NavLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  const location = useLocation()
  const active = location.pathname === to || location.pathname.startsWith(to + '/')
  return <Link to={to} className={active ? 'active' : ''}>{icon}<span style={{ marginLeft: 4 }}>{label}</span></Link>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="loading-spinner" /></div>
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="loading-spinner" /></div>
  if (!user || user.role !== 'ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  const { user, signOut } = useAuth()
  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" className="app-header-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Compass size={20} style={{ color: 'var(--color-primary-600)' }} />Align To SDG
        </Link>
        <nav className="app-nav">
          <NavLink to="/" label="Home" icon={<BookOpen size={15} />} />
          {user && <NavLink to="/create" label="Create" icon={<Compass size={15} />} />}
          {user && <NavLink to="/history" label="History" icon={<Clock size={15} />} />}
          {user && <NavLink to="/graph" label="Graph" icon={<Network size={15} />} />}
          <NavLink to="/help" label="Help" icon={<HelpCircle size={15} />} />
          {user?.role === 'ADMIN' && <NavLink to="/admin" label="Admin" icon={<Shield size={15} />} />}
          {user ? (
            <button onClick={signOut} className="btn btn-outline" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}><LogOut size={14} />Sign Out</button>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}>Sign In</Link>
          )}
        </nav>
      </header>
      <main className="app-main">
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}><span className="loading-spinner" /></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/help" element={<Help />} />
            <Route path="/create" element={<ProtectedRoute><CreateRecommendation /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><MyHistory /></ProtectedRoute>} />
            <Route path="/graph" element={<ProtectedRoute><KnowledgeGraph /></ProtectedRoute>} />
            <Route path="/kit/:kitId" element={<ProtectedRoute><KitView /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="app-footer">Align To SDG v1.0 — An Ontology-Knowledge Graph Driven Recommendation System for Integrating Sustainability Concepts in Higher Education Curricula</footer>
    </div>
  )
}
