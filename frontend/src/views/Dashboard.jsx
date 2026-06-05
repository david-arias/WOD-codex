/**
 * Dashboard.jsx — Vista principal: Crónicas Activas.
 * Fase 4: datos reales desde GET /api/v1/chronicles/ + modal de creación.
 *
 * Cambios respecto a Fase 3:
 *   - Mock data eliminado; se carga desde FastAPI con JWT de Supabase.
 *   - `game_line` (V20/W20/M20) determina dinámicamente color de borde y badge.
 *   - Botón "+ Nueva Crónica" abre un modal minimalista (POST /api/v1/chronicles/).
 *   - `last_played_at` (ISO datetime) se convierte a texto relativo.
 *
 * Mapeo de colores (sincronizado con tailwind.config.js):
 *   V20 → faction/blood  (rojo    #9b1a1a)
 *   W20 → faction/amber  (ámbar   #d97706)
 *   M20 → faction/arcane (púrpura #7c3aed)
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, authFetch } from '../context/AuthContext'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'

// ── Mapeo game_line → faction ─────────────────────────────────────
const GAME_LINE_MAP = {
  V20: { faction: 'blood',  badge: 'blood',  label: 'Vampiro V20'      },
  W20: { faction: 'amber',  badge: 'amber',  label: 'Hombre Lobo W20'  },
  M20: { faction: 'arcane', badge: 'arcane', label: 'Mago M20'         },
}

// ── Tiempo relativo ───────────────────────────────────────────────
function relativeTime(isoString) {
  if (!isoString) return 'Nunca'
  const diff  = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  if (mins  < 2)  return 'Ahora'
  if (hours < 1)  return `Hace ${mins} min`
  if (hours < 24) return `Hace ${hours}h`
  if (days  < 7)  return `Hace ${days} día${days !== 1 ? 's' : ''}`
  if (weeks < 5)  return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`
  return new Date(isoString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// ── Iconos ────────────────────────────────────────────────────────
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="3.5" r="1.2"/>
    <circle cx="8" cy="8" r="1.2"/>
    <circle cx="8" cy="12.5" r="1.2"/>
  </svg>
)
const IconUsers = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 11C1 9.34315 2.79086 8 5 8C7.20914 8 9 9.34315 9 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="10.5" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M13 11C13 9.61929 11.933 8.5 10.5 8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="7" y1="2" x2="7" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconSparkle = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M14 2L15.8 10.2L24 12L15.8 13.8L14 22L12.2 13.8L4 12L12.2 10.2L14 2Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M22 20L22.9 23.1L26 24L22.9 24.9L22 28L21.1 24.9L18 24L21.1 23.1L22 20Z"
      stroke="currentColor" strokeWidth="1" strokeLinejoin="round"/>
  </svg>
)
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

// ── Chronicle Card ────────────────────────────────────────────────
function ChronicleCard({ chronicle, onClick }) {
  const meta = GAME_LINE_MAP[chronicle.game_line] ?? GAME_LINE_MAP.V20

  return (
    <Card
      faction={meta.faction}
      onClick={onClick}
      className="flex flex-col h-52 relative overflow-hidden group"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <Badge variant={meta.badge}>{meta.label}</Badge>
        <button
          onClick={e => e.stopPropagation()}
          className="text-[#6b7280] hover:text-[#c4c7c8] transition-colors p-0.5 rounded"
        >
          <IconDots />
        </button>
      </div>

      {/* Título + tagline */}
      <div className="flex-1 px-4">
        <h3 className="font-playfair text-[20px] font-semibold text-[#e5e2e1] leading-tight mb-1">
          {chronicle.title}
        </h3>
        {chronicle.tagline && (
          <p className="text-[12px] text-[#6b7280] leading-snug line-clamp-2 font-inter">
            {chronicle.tagline}
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3 mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex items-center gap-1.5 text-[#6b7280]">
          <IconUsers />
          <span className="text-[12px] font-inter">
            {chronicle.session_count > 0
              ? `${chronicle.session_count} Sesión${chronicle.session_count !== 1 ? 'es' : ''}`
              : 'Sin sesiones'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[#6b7280]">
          <IconClock />
          <span className="text-[12px] font-inter">
            {relativeTime(chronicle.last_played_at ?? chronicle.created_at)}
          </span>
        </div>
      </div>
    </Card>
  )
}

// ── Empty Card ────────────────────────────────────────────────────
function EmptyCard({ onCreate }) {
  return (
    <button
      onClick={onCreate}
      className="h-52 rounded border border-dashed border-white/[0.08]
                 flex flex-col items-center justify-center gap-3
                 text-[#6b7280] hover:text-[#9ca3af] hover:border-white/[0.14]
                 transition-all duration-200 group bg-transparent cursor-pointer w-full"
    >
      <span className="group-hover:scale-110 transition-transform duration-200">
        <IconSparkle />
      </span>
      <span className="text-[13px] font-inter italic leading-snug text-center px-4">
        El tapiz aguarda nuevos hilos.
      </span>
    </button>
  )
}

// ── Modal: Nueva Crónica ──────────────────────────────────────────
const GAME_LINES = [
  { value: 'V20', label: 'Vampiro: La Mascarada V20' },
  { value: 'W20', label: 'Hombre Lobo: El Apocalipsis W20' },
  { value: 'M20', label: 'Mago: La Ascensión M20' },
]

function NewChronicleModal({ onClose, onCreated, token }) {
  const [title,    setTitle]    = useState('')
  const [tagline,  setTagline]  = useState('')
  const [gameLine, setGameLine] = useState('V20')
  const [error,    setError]    = useState(null)
  const [saving,   setSaving]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setError(null)
    setSaving(true)
    try {
      const res = await authFetch(token, '/api/v1/chronicles/', {
        method: 'POST',
        body: JSON.stringify({
          title:     title.trim(),
          tagline:   tagline.trim() || null,
          game_line: gameLine,
          setting:   {},
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail ?? `Error ${res.status}`)
      }
      const newChronicle = await res.json()
      onCreated(newChronicle)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose() }

  const baseInput = {
    backgroundColor: '#121212',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#e5e2e1',
    padding: '10px 12px',
    borderRadius: '6px',
    width: '100%',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const onFocus = (e) => {
    e.target.style.borderColor = 'rgba(155,26,26,0.5)'
    e.target.style.boxShadow   = '0 0 0 3px rgba(155,26,26,0.1)'
  }
  const onBlur = (e) => {
    e.target.style.borderColor = 'rgba(255,255,255,0.08)'
    e.target.style.boxShadow   = 'none'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-md rounded-lg p-6"
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-[22px] font-semibold" style={{ color: '#e5e2e1' }}>
            Nueva Crónica
          </h2>
          <button onClick={onClose} className="text-[#6b7280] hover:text-[#c4c7c8] transition-colors">
            <IconClose />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Título */}
          <div className="flex flex-col gap-1.5">
            <label className="label-caps" style={{ color: '#6b7280' }}>Título *</label>
            <input
              type="text" required value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Chicago by Night"
              style={baseInput} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Tagline */}
          <div className="flex flex-col gap-1.5">
            <label className="label-caps" style={{ color: '#6b7280' }}>Tagline</label>
            <input
              type="text" value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="La Camarilla tiembla. El Príncipe ha desaparecido."
              style={baseInput} onFocus={onFocus} onBlur={onBlur}
            />
          </div>

          {/* Sistema */}
          <div className="flex flex-col gap-1.5">
            <label className="label-caps" style={{ color: '#6b7280' }}>Sistema de juego</label>
            <select
              value={gameLine} onChange={e => setGameLine(e.target.value)}
              style={{ ...baseInput, cursor: 'pointer' }}
              onFocus={onFocus} onBlur={onBlur}
            >
              {GAME_LINES.map(gl => (
                <option key={gl.value} value={gl.value} style={{ backgroundColor: '#1a1a1a' }}>
                  {gl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded px-3 py-2.5 font-inter text-[13px]"
              style={{ backgroundColor: 'rgba(155,26,26,0.12)', border: '1px solid rgba(155,26,26,0.3)', color: '#f87171' }}
            >
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 mt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 rounded label-caps"
              style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#6b7280', padding: '10px 16px', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#c4c7c8' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6b7280' }}
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={saving || !title.trim()}
              className="flex-1 rounded label-caps transition-all duration-150"
              style={{
                backgroundColor: saving || !title.trim() ? 'rgba(155,26,26,0.4)' : '#9b1a1a',
                color: saving || !title.trim() ? '#6b7280' : '#e5e2e1',
                padding: '10px 16px', border: 'none',
                cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!saving && title.trim()) e.currentTarget.style.backgroundColor = '#b91c1c' }}
              onMouseLeave={e => { if (!saving && title.trim()) e.currentTarget.style.backgroundColor = '#9b1a1a' }}
            >
              {saving ? 'Creando…' : 'Crear Crónica'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { token } = useAuth()

  const [chronicles, setChronicles] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [showModal,  setShowModal]  = useState(false)

  // Fetch inicial
  const loadChronicles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await authFetch(token, '/api/v1/chronicles/?size=50')
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setChronicles(data.items ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { loadChronicles() }, [loadChronicles])

  const active   = chronicles.filter(c => c.status === 'active')
  const archived = chronicles.filter(c => c.status !== 'active')

  const handleCreated = (newChronicle) => {
    setChronicles(prev => [newChronicle, ...prev])
  }

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Encabezado */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6 shrink-0">
          <div>
            <h1 className="font-playfair text-[32px] font-semibold text-[#e5e2e1] leading-tight">
              Crónicas Activas
            </h1>
            <p className="text-[14px] text-[#9ca3af] font-inter mt-1">
              Gestiona tus campañas y narrativas en curso.
            </p>
          </div>
          <Button variant="ghost" icon={<IconPlus />} onClick={() => setShowModal(true)}>
            Nueva Crónica
          </Button>
        </div>

        {/* Contenido */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto scrollable">

          {/* Cargando */}
          {loading && (
            <div className="flex items-center justify-center h-48 gap-3">
              <div
                className="w-6 h-6 rounded-full border-2 border-transparent animate-spin"
                style={{ borderTopColor: '#9b1a1a' }}
              />
              <span className="font-inter text-[13px]" style={{ color: '#444748' }}>
                Cargando crónicas…
              </span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              className="rounded-lg px-4 py-3 mb-4 font-inter text-[13px]"
              style={{ backgroundColor: 'rgba(155,26,26,0.1)', border: '1px solid rgba(155,26,26,0.25)', color: '#f87171' }}
            >
              Error al cargar las crónicas: {error}.{' '}
              <button onClick={loadChronicles} className="underline" style={{ color: '#f87171' }}>
                Reintentar
              </button>
            </div>
          )}

          {/* Grid activas */}
          {!loading && !error && (
            <div className="grid grid-cols-3 gap-4">
              {active.map(chronicle => (
                <ChronicleCard
                  key={chronicle.id}
                  chronicle={chronicle}
                  onClick={() => navigate(`/cronica/${chronicle.id}`)}
                />
              ))}
              <EmptyCard onCreate={() => setShowModal(true)} />
            </div>
          )}

          {/* Archivadas */}
          {!loading && (
            <div className="mt-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="label-caps text-[#6b7280]">Archivadas</span>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>
              {archived.length === 0 ? (
                <p className="text-[13px] text-[#444748] font-inter italic">
                  No hay crónicas archivadas.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {archived.map(chronicle => (
                    <ChronicleCard
                      key={chronicle.id}
                      chronicle={chronicle}
                      onClick={() => navigate(`/cronica/${chronicle.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <NewChronicleModal
          token={token}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  )
}
