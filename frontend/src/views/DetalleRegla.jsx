/**
 * DetalleRegla.jsx — Vista de detalle de una regla del Grimorio.
 * Fase 5: Ruta /grimorio/:gameLine/:slug
 *
 * Consume GET /api/v1/gamerules/detail/{game_line}/{slug}.
 * Renderiza el system_text en Markdown de forma elegante para lectura en mesa.
 *
 * Diseño Deep Dark Mode Gothic-Punk:
 *   - Playfair Display para títulos y encabezados
 *   - Inter para body y mecánicas
 *   - Accent de facción dinámico (V20/W20/M20)
 *   - Ancho de lectura máximo 720px centrado
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth, authFetch } from '../context/AuthContext'

// ── Tema por facción (mismo que Grimorio) ─────────────────────
const GAME_THEME = {
  v20: { label:'Vampiro V20', accent:'#c62828', accentDim:'#8b1a1a', accentText:'#f87171', glow:'rgba(139,26,26,0.15)', border:'rgba(198,40,40,0.3)' },
  w20: { label:'Hombre Lobo W20', accent:'#d97706', accentDim:'#92400e', accentText:'#fbbf24', glow:'rgba(146,64,14,0.15)', border:'rgba(217,119,6,0.3)' },
  m20: { label:'Mago M20', accent:'#7c3aed', accentDim:'#4c1d95', accentText:'#a78bfa', glow:'rgba(76,29,149,0.15)', border:'rgba(124,58,237,0.3)' },
}

const CATEGORY_LABELS = {
  discipline:'Disciplina', clan:'Clan', sect:'Secta', ritual:'Ritual',
  virtue:'Virtud', path:'Camino', background:'Trasfondo',
  gift:'Don', tribe:'Tribu', rite:'Rito', rank:'Rango',
  sphere:'Esfera', tradition:'Tradición', paradigm:'Paradigma',
  merit:'Mérito', flaw:'Defecto', other:'Regla',
}

// ── Renderer de Markdown simple (sin dependencias externas) ──
function renderMarkdown(text) {
  if (!text) return null

  const lines  = text.split('\n')
  const result = []
  let i        = 0
  let paraBuffer = []

  const flushPara = () => {
    if (paraBuffer.length > 0) {
      const content = paraBuffer.join(' ').trim()
      if (content) {
        result.push(
          <p key={`p-${result.length}`}
            className="font-inter text-[15px] leading-relaxed mb-4"
            style={{ color: '#c4c7c8' }}
            dangerouslySetInnerHTML={{ __html: inlineMarkdown(content) }}
          />
        )
      }
      paraBuffer = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    // Encabezado H1
    if (line.startsWith('# ')) {
      flushPara()
      result.push(
        <h1 key={`h1-${i}`}
          className="font-playfair text-[26px] font-semibold leading-tight mb-2 mt-6"
          style={{ color: '#e5e2e1' }}>
          {line.slice(2)}
        </h1>
      )
    }
    // Encabezado H2
    else if (line.startsWith('## ')) {
      flushPara()
      result.push(
        <h2 key={`h2-${i}`}
          className="font-playfair text-[18px] font-semibold leading-tight mt-6 mb-2"
          style={{ color: '#e5e2e1' }}>
          {line.slice(3)}
        </h2>
      )
    }
    // Encabezado H3
    else if (line.startsWith('### ')) {
      flushPara()
      result.push(
        <h3 key={`h3-${i}`}
          className="font-inter text-[14px] font-semibold uppercase tracking-wider mt-5 mb-2"
          style={{ color: '#9ca3af', letterSpacing: '0.06em' }}>
          {line.slice(4)}
        </h3>
      )
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      flushPara()
      result.push(
        <blockquote key={`bq-${i}`}
          className="font-playfair italic text-[14px] leading-relaxed my-4 pl-4"
          style={{
            color: '#9ca3af',
            borderLeft: '2px solid rgba(255,255,255,0.12)',
          }}
          dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.slice(2)) }}
        />
      )
    }
    // Separador horizontal
    else if (line.match(/^---+$/) || line.match(/^\*\*\*+$/)) {
      flushPara()
      result.push(
        <hr key={`hr-${i}`} className="my-6"
          style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)' }} />
      )
    }
    // Línea vacía → flush párrafo
    else if (line.trim() === '') {
      flushPara()
    }
    // Línea normal → acumular en párrafo
    else {
      paraBuffer.push(line)
    }

    i++
  }
  flushPara()
  return result
}

// Convierte inline markdown (**bold**, *italic*, `code`) a HTML
function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e5e2e1;font-weight:600">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="font-family:\'JetBrains Mono\',monospace;font-size:12px;background:rgba(255,255,255,0.06);padding:1px 5px;border-radius:3px;color:#a78bfa">$1</code>')
}

// ── Iconos ────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconBook = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="1.5" width="10" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <line x1="4.5" y1="6.5" x2="9.5" y2="6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
    <line x1="4.5" y1="8.5" x2="7.5" y2="8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
  </svg>
)

// ── Vista Principal ───────────────────────────────────────────
export default function DetalleRegla() {
  const { gameLine, slug } = useParams()
  const navigate           = useNavigate()
  const { token }          = useAuth()

  const [rule,    setRule]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const theme = GAME_THEME[gameLine?.toLowerCase()] ?? GAME_THEME.v20

  useEffect(() => {
    if (!token || !gameLine || !slug) return

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await authFetch(token, `/api/v1/gamerules/detail/${gameLine.toUpperCase()}/${slug}`)
        if (res.ok) {
          setRule(await res.json())
        } else if (res.status === 404) {
          setError('Esta regla no se encuentra en el Grimorio.')
        } else {
          setError(`Error ${res.status} al cargar la regla.`)
        }
      } catch {
        setError('No se pudo conectar con el Códice.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token, gameLine, slug])

  return (
    <div className="h-full overflow-y-auto scrollable">
      <div className="max-w-[720px] mx-auto px-8 py-8">

        {/* ── Breadcrumb ───────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-8">
          <Link
            to="/grimorio"
            className="flex items-center gap-1.5 font-inter text-[13px] transition-colors"
            style={{ color: '#6b7280', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = theme.accentText}
            onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
          >
            <IconArrowLeft />
            El Grimorio
          </Link>
          <span style={{ color: '#444748' }}>·</span>
          <span className="font-inter text-[13px]" style={{ color: '#444748' }}>
            {theme.label}
          </span>
          {rule && (
            <>
              <span style={{ color: '#444748' }}>·</span>
              <span className="font-inter text-[13px]" style={{ color: '#6b7280' }}>
                {CATEGORY_LABELS[rule.category] ?? rule.category}
              </span>
            </>
          )}
        </div>

        {/* ── Estado: cargando ─────────────────────────────── */}
        {loading && (
          <div className="flex items-center gap-3 py-16 justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-transparent animate-spin"
              style={{ borderTopColor: theme.accent }} />
            <span className="font-inter text-[13px]" style={{ color: '#444748' }}>
              Consultando el Grimorio…
            </span>
          </div>
        )}

        {/* ── Estado: error ────────────────────────────────── */}
        {!loading && error && (
          <div className="text-center py-16">
            <p className="font-playfair text-[20px] mb-3" style={{ color: '#444748' }}>
              {error}
            </p>
            <button onClick={() => navigate('/grimorio')}
              className="font-inter text-[13px] underline" style={{ color: theme.accentText }}>
              Volver al Grimorio
            </button>
          </div>
        )}

        {/* ── Contenido de la regla ────────────────────────── */}
        {!loading && rule && (
          <>
            {/* Header de la regla */}
            <div className="mb-8 pb-6"
              style={{ borderBottom: `1px solid ${theme.border}` }}>

              {/* Badge de categoría + nivel */}
              <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[11px] px-2 py-1 rounded"
                  style={{ color: theme.accentText, backgroundColor: `${theme.accentDim}50`, border: `1px solid ${theme.border}` }}>
                  {CATEGORY_LABELS[rule.category] ?? rule.category}
                </span>
                {rule.level && (
                  <span className="font-mono text-[11px] px-2 py-1 rounded"
                    style={{ color: '#9ca3af', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    Nivel {rule.level}
                  </span>
                )}
                {rule.group_affinity && (
                  <span className="font-inter text-[11px] px-2 py-1 rounded"
                    style={{ color: '#6b7280', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {rule.group_affinity}
                  </span>
                )}
              </div>

              {/* Título principal */}
              <h1 className="font-playfair text-[36px] font-semibold leading-tight mb-1"
                style={{ color: '#e5e2e1' }}>
                {rule.name}
              </h1>
              {rule.name_en && rule.name_en !== rule.name && (
                <p className="font-inter text-[14px] italic" style={{ color: '#6b7280' }}>
                  {rule.name_en}
                </p>
              )}

              {/* Fuente bibliográfica */}
              {rule.source_book && (
                <div className="flex items-center gap-1.5 mt-3">
                  <IconBook />
                  <span className="font-inter text-[12px]" style={{ color: '#444748' }}>
                    {rule.source_book}{rule.source_page ? `, p. ${rule.source_page}` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Descripción narrativa */}
            {rule.description && (
              <div className="mb-6">
                <p className="font-inter text-[15px] leading-relaxed" style={{ color: '#c4c7c8' }}>
                  {rule.description}
                </p>
              </div>
            )}

            {/* Efecto mecánico — siempre visible como bloque destacado */}
            {rule.mechanical_effect && rule.mechanical_effect !== 'Ver system_text.' && (
              <div className="rounded-lg p-5 mb-6"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}` }}>
                <p className="font-mono text-[11px] uppercase tracking-wider mb-3"
                  style={{ color: theme.accentText, letterSpacing: '0.08em' }}>
                  Sistema
                </p>
                <p className="font-inter text-[14px] leading-relaxed" style={{ color: '#c4c7c8' }}>
                  {rule.mechanical_effect}
                </p>
              </div>
            )}

            {/* Texto completo del libro (Markdown) */}
            {rule.system_text && (
              <div className="prose-wod">
                {renderMarkdown(rule.system_text)}
              </div>
            )}

            {/* Tags */}
            {rule.tags && rule.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-8 pt-6"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {rule.tags.map(tag => (
                  <span key={tag}
                    className="font-mono text-[10px] px-2 py-1 rounded"
                    style={{ color: '#6b7280', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Navegación inferior */}
            <div className="mt-12 pt-6 flex items-center justify-between"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link to="/grimorio"
                className="flex items-center gap-1.5 font-inter text-[13px] transition-colors"
                style={{ color: '#6b7280', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = theme.accentText}
                onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
                <IconArrowLeft />
                Volver al Grimorio
              </Link>
              {rule.is_verified && (
                <span className="font-mono text-[10px]" style={{ color: '#444748' }}>
                  ✓ Verificado contra el libro oficial
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
