/**
 * Login.jsx — Vista de autenticación de El Códice del Narrador.
 *
 * Diseño: Gothic-Punk Modern
 *   - Fondo: #121212 (surface-void)
 *   - Contenedor: #1a1a1a con ghost border
 *   - Inputs: ghost border + focus glow faction/blood
 *   - Botón: label-caps estilo custom (variante blood/primary)
 *   - Tipografía: Playfair Display (headings) + Inter (body)
 *
 * Flujo:
 *   1. Usuario introduce email + contraseña.
 *   2. Se llama a signIn() del AuthContext (Supabase signInWithPassword).
 *   3. Si hay error → se muestra mensaje inline.
 *   4. Si éxito → onAuthStateChange del AuthContext actualiza la sesión
 *      → App.jsx redirige automáticamente al Dashboard.
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

// ── Icono decorativo (sello del códice) ──────────────────────────
const CodiceSeal = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="mx-auto mb-6 opacity-80">
    <circle cx="24" cy="24" r="22" stroke="#9b1a1a" strokeWidth="1.5" strokeDasharray="4 2"/>
    <path
      d="M24 6L26.4 16.8L37 12L30.6 21.4L42 24L30.6 26.6L37 36L26.4 31.2L24 42L21.6 31.2L11 36L17.4 26.6L6 24L17.4 21.4L11 12L21.6 16.8L24 6Z"
      stroke="#9b1a1a" strokeWidth="1.2" strokeLinejoin="round" fill="none"
    />
    <circle cx="24" cy="24" r="4" fill="#9b1a1a" fillOpacity="0.3" stroke="#9b1a1a" strokeWidth="1"/>
  </svg>
)

// ── Componente principal ──────────────────────────────────────────
export default function Login() {
  const { signIn } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState(null)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email.trim(), password)

    if (error) {
      // Traducir mensajes comunes de Supabase al español
      const msg = error.message.toLowerCase()
      if (msg.includes('invalid login credentials') || msg.includes('email not confirmed')) {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.')
      } else if (msg.includes('too many requests')) {
        setError('Demasiados intentos. Espera un momento e inténtalo de nuevo.')
      } else {
        setError(error.message)
      }
    }
    // Si no hay error, onAuthStateChange en AuthContext redirigirá automáticamente

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#121212' }}
    >
      {/* ── Contenedor central ─────────────────────────────────── */}
      <div
        className="w-full max-w-sm rounded-lg p-8"
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Sello decorativo */}
        <CodiceSeal />

        {/* Heading */}
        <div className="text-center mb-8">
          <h1
            className="font-playfair text-[28px] font-semibold leading-tight"
            style={{ color: '#e5e2e1' }}
          >
            El Códice
          </h1>
          <p
            className="font-inter text-[13px] mt-1.5"
            style={{ color: '#6b7280' }}
          >
            Accede a tus crónicas del Mundo de Tinieblas
          </p>
        </div>

        {/* ── Formulario ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="label-caps"
              style={{ color: '#6b7280' }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="narrador@ejemplo.com"
              className="w-full rounded font-inter text-[14px] transition-all duration-150 outline-none"
              style={{
                backgroundColor: '#121212',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e5e2e1',
                padding: '10px 12px',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(155,26,26,0.6)'
                e.target.style.boxShadow   = '0 0 0 3px rgba(155,26,26,0.12)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                e.target.style.boxShadow   = 'none'
              }}
            />
          </div>

          {/* Contraseña */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="label-caps"
              style={{ color: '#6b7280' }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded font-inter text-[14px] transition-all duration-150 outline-none"
              style={{
                backgroundColor: '#121212',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#e5e2e1',
                padding: '10px 12px',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(155,26,26,0.6)'
                e.target.style.boxShadow   = '0 0 0 3px rgba(155,26,26,0.12)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.08)'
                e.target.style.boxShadow   = 'none'
              }}
            />
          </div>

          {/* Error inline */}
          {error && (
            <div
              className="rounded px-3 py-2.5 font-inter text-[13px] leading-snug"
              style={{
                backgroundColor: 'rgba(155,26,26,0.12)',
                border: '1px solid rgba(155,26,26,0.3)',
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded label-caps transition-all duration-150 mt-1"
            style={{
              backgroundColor: loading ? 'rgba(155,26,26,0.4)' : '#9b1a1a',
              color: loading ? '#9ca3af' : '#e5e2e1',
              padding: '11px 16px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 1px 3px rgba(0,0,0,0.4)',
            }}
            onMouseEnter={e => {
              if (!loading) e.currentTarget.style.backgroundColor = '#b91c1c'
            }}
            onMouseLeave={e => {
              if (!loading) e.currentTarget.style.backgroundColor = '#9b1a1a'
            }}
          >
            {loading ? 'Accediendo...' : 'Acceder al Códice'}
          </button>
        </form>

        {/* Nota de pie */}
        <p
          className="text-center font-inter text-[12px] mt-6"
          style={{ color: '#444748' }}
        >
          Sin cuenta, contacta a tu Narrador.
        </p>
      </div>
    </div>
  )
}
