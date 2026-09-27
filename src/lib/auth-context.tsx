import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserRole, UserStatus } from '../types/domain'

export interface AuthUser { id: string; email: string; role: UserRole; status: UserStatus; displayName: string }
interface AuthContextValue { user: AuthUser | null; session: Session | null; loading: boolean; signIn: (e: string, p: string) => Promise<void>; signUp: (e: string, p: string, n: string) => Promise<void>; signOut: () => Promise<void>; isAdmin: boolean }
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadUserProfile(session.user)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) loadUserProfile(session.user)
      else { setUser(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadUserProfile(authUser: User) {
    const { data, error } = await supabase.from('user_profiles').select('role, status, display_name').eq('id', authUser.id).maybeSingle()
    if (error || !data) {
      await supabase.from('user_profiles').insert({ id: authUser.id, email: authUser.email, display_name: authUser.email?.split('@')[0] || 'User', role: 'EDUCATOR', status: 'ACTIVE' })
      setUser({ id: authUser.id, email: authUser.email || '', role: 'EDUCATOR', status: 'ACTIVE', displayName: authUser.email?.split('@')[0] || 'User' })
    } else {
      setUser({ id: authUser.id, email: authUser.email || '', role: data.role as UserRole, status: data.status as UserStatus, displayName: data.display_name || authUser.email?.split('@')[0] || 'User' })
    }
    setLoading(false)
  }

  async function signIn(email: string, password: string) { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error }
  async function signUp(email: string, password: string, displayName: string) {
    const { data, error } = await supabase.auth.signUp({ email, password }); if (error) throw error
    if (data.user) await supabase.from('user_profiles').insert({ id: data.user.id, email, display_name: displayName, role: 'EDUCATOR', status: 'ACTIVE' })
  }
  async function signOut() { await supabase.auth.signOut(); setUser(null); setSession(null) }

  return <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, isAdmin: user?.role === 'ADMIN' }}>{children}</AuthContext.Provider>
}

export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used within AuthProvider'); return ctx }
