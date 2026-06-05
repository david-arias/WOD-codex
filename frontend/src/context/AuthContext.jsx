/**
 * AuthContext.jsx — Contexto global de autenticación con Supabase.
 *
 * Provee al árbol de componentes:
 *   session  → Objeto de sesión de Supabase (null si no autenticado)
 *   user     → user de Supabase (null si no autenticado)
 *   token    → JWT Bearer para adjuntar a peticiones a FastAPI
 *   loading  → true durante la hidratación inicial de la sesión
 *   signIn   → (email, password) → Promise<{ error }>
 *   signOut  → () → Promise<void>
 *
 * Uso en cualquier componente:
 *   const { token, signOut } = useAuth()
 *
 * Flujo:
 *   1. Al montar, Supabase restaura la sesión desde localStorage.
 *   2. onAuthStateChange sincroniza el estado ante login/logout/refresh.
 *   3. El token se extrae de session.access_token y se expone directamente.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// ── Contexto ─────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined)  // undefined = hidratando
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    // Recuperar la sesión existente al montar (localStorage)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Escuchar cambios: login, logout, token refresh, cambio de pestaña
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ── Acciones de auth ───────────────────────────────────────────
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // ── Valor del contexto ─────────────────────────────────────────
  const value = {
    session,
    user:    session?.user    ?? null,
    token:   session?.access_token ?? null,
    loading,
    signIn,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook de consumo ───────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  return ctx
}

// ── Helper: fetch autenticado ─────────────────────────────────────
/**
 * Wrapper de fetch que adjunta automáticamente el JWT de Supabase.
 *
 * Uso:
 *   const { token } = useAuth()
 *   const res = await authFetch(token, '/api/v1/chronicles/', { method: 'GET' })
 *   const data = await res.json()
 *
 * El base URL se toma de VITE_API_BASE_URL (.env.local).
 * Por defecto: http://localhost:8000
 */
export async function authFetch(token, path, options = {}) {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
  const url  = `${base}${path}`

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  return fetch(url, { ...options, headers })
}
