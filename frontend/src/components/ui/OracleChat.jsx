/**
 * OracleChat.jsx — Widget flotante del Oráculo AI de El Grimorio.
 * Fase 5.5: Botón circular + popover de chat que se despliega suavemente.
 *
 * Props:
 *   theme → objeto GAME_THEME del juego activo (accent, accentText, glow, border)
 *
 * En Fase 6 se conectará al endpoint POST /api/v1/ai/oracle.
 * Por ahora responde con mensajes mock.
 */

import { useState, useRef, useEffect } from 'react'

// ── Mensajes iniciales mock ────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'oracle',
    text: 'El Grimorio aguarda tus preguntas, Narrador. Consulta sobre reglas, disciplinas, lore o cualquier duda de mesa.',
    time: 'ahora',
  },
]

// ── Respuestas mock del Oráculo ───────────────────────────────
const MOCK_RESPONSES = [
  'Según el reglamento de V20 (p. 142), esta mecánica funciona así: cada éxito en la tirada de Destreza + Sigilo se compara contra la Percepción + Alerta del observador.',
  'En M20, la Paradoja se acumula en la Rueda del personaje. Un estallido ocurre cuando alcanza el valor de Areté × 5. La forma más segura de disiparla es mediante meditación (Quintaesencia).',
  'Los Nosferatu tienen Apariencia permanente en 0 y no pueden subirla. Sin embargo, pueden usar Ofuscación para proyectar una apariencia falsa ante los mortales.',
  'En W20, un Garou en forma Crinos que interactúa con humanos debe superar la tirada de Autocontrol (dif. 6) o ceder ante la Rabia. El Delerio protege a los mortales al hacer que olviden.',
  'La Paradoja: recuerda que los efectos coincidentes no generan Paradoja al tener éxito. Solo los efectos vulgares la acumulan, y son dobles si hay testigos Durmientes presentes.',
]

// ── Iconos ────────────────────────────────────────────────────
const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <ellipse cx="10" cy="10" rx="8" ry="5" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="10" cy="10" r="2.5" fill="currentColor" fillOpacity="0.6"/>
    <circle cx="10" cy="10" r="1" fill="currentColor"/>
  </svg>
)
const IconSend = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M13 7.5L2 2L4.5 7.5L2 13L13 7.5Z" fill="currentColor" fillOpacity="0.9" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round"/>
  </svg>
)
const IconClose = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)
const IconMinus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)

// ── Burbuja de mensaje ────────────────────────────────────────
function MessageBubble({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[82%] rounded-lg px-3 py-2"
          style={{ backgroundColor: '#2a2a2a', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="font-inter text-[13px] leading-relaxed" style={{ color: '#e5e2e1' }}>
            {msg.text}
          </p>
          <p className="font-mono text-[10px] mt-1 text-right" style={{ color: '#444748' }}>{msg.time}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 mb-3">
      {/* Avatar del Oráculo */}
      <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
        style={{ backgroundColor: 'rgba(76,29,149,0.3)', border: '1px solid rgba(124,58,237,0.3)' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <ellipse cx="6" cy="6" rx="4.5" ry="3" stroke="#a78bfa" strokeWidth="1"/>
          <circle cx="6" cy="6" r="1.2" fill="#a78bfa" fillOpacity="0.7"/>
        </svg>
      </div>
      <div className="flex-1">
        {msg.narrative && (
          <p className="font-playfair italic text-[12px] leading-relaxed mb-1.5" style={{ color: '#6b7280' }}>
            {msg.narrative}
          </p>
        )}
        <div className="rounded-lg px-3 py-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="font-inter text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: '#c4c7c8' }}>
            {msg.text}
          </p>
        </div>
        <p className="font-mono text-[10px] mt-1 pl-1" style={{ color: '#444748' }}>{msg.time}</p>
      </div>
    </div>
  )
}

// ── OracleChat ────────────────────────────────────────────────
export default function OracleChat({ theme }) {
  const [isOpen,      setIsOpen]      = useState(false)
  const [minimized,   setMinimized]   = useState(false)
  const [messages,    setMessages]    = useState(INITIAL_MESSAGES)
  const [input,       setInput]       = useState('')
  const [isTyping,    setIsTyping]    = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  // Scroll al último mensaje
  useEffect(() => {
    if (isOpen && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, minimized])

  // Focus al abrir
  useEffect(() => {
    if (isOpen && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, minimized])

  const handleOpen = () => {
    setIsOpen(true)
    setMinimized(false)
  }

  const now = () => {
    const d = new Date()
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return

    // Añadir mensaje del usuario
    const userMsg = { id: Date.now(), role: 'user', text, time: now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simular respuesta del Oráculo (en Fase 6: POST /api/v1/ai/oracle)
    await new Promise(r => setTimeout(r, 900 + Math.random() * 600))
    const response = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      role: 'oracle',
      text: response,
      narrative: null,
      time: now(),
    }])
    setIsTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const accentColor  = theme?.accent     ?? '#7c3aed'
  const accentText   = theme?.accentText ?? '#a78bfa'
  const accentGlow   = theme?.glow       ?? 'rgba(76,29,149,0.25)'
  const accentBorder = theme?.border     ?? 'rgba(124,58,237,0.35)'

  return (
    <>
      {/* ── Ventana flotante ─────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed z-50"
          style={{
            bottom: '88px',
            right: '24px',
            width: '340px',
            borderRadius: '12px',
            backgroundColor: '#1a1a1a',
            border: `1px solid ${accentBorder}`,
            boxShadow: `0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px ${accentBorder}`,
            animation: 'oracle-slide-up 0.2s ease forwards',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3"
            style={{ borderBottom: `1px solid ${accentBorder}`, backgroundColor: `${accentColor}18` }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${accentColor}30`, border: `1px solid ${accentBorder}` }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <ellipse cx="6" cy="6" rx="4.5" ry="3" stroke={accentText} strokeWidth="1"/>
                <circle cx="6" cy="6" r="1.2" fill={accentText} fillOpacity="0.8"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-inter text-[13px] font-semibold" style={{ color: '#e5e2e1' }}>
                Oráculo del Grimorio
              </p>
              <p className="font-inter text-[10px]" style={{ color: accentText }}>
                {isTyping ? 'Consultando el Tapiz...' : 'En línea'}
              </p>
            </div>
            <button onClick={() => setMinimized(m => !m)}
              className="transition-colors p-1 rounded"
              style={{ color: '#6b7280' }}
              onMouseEnter={e => e.currentTarget.style.color = '#c4c7c8'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
              <IconMinus />
            </button>
            <button onClick={() => setIsOpen(false)}
              className="transition-colors p-1 rounded"
              style={{ color: '#6b7280' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}>
              <IconClose />
            </button>
          </div>

          {/* Cuerpo (ocultable con minimizar) */}
          {!minimized && (
            <>
              {/* Mensajes */}
              <div className="overflow-y-auto scrollable px-3 py-3"
                style={{ height: '300px', backgroundColor: '#141313' }}>
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

                {/* Indicador de escritura */}
                {isTyping && (
                  <div className="flex gap-2 mb-3">
                    <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                      style={{ backgroundColor: 'rgba(76,29,149,0.3)', border: '1px solid rgba(124,58,237,0.3)' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <ellipse cx="6" cy="6" rx="4.5" ry="3" stroke="#a78bfa" strokeWidth="1"/>
                        <circle cx="6" cy="6" r="1.2" fill="#a78bfa" fillOpacity="0.7"/>
                      </svg>
                    </div>
                    <div className="rounded-lg px-3 py-2.5 flex gap-1 items-center"
                      style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: accentText, animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3"
                style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, backgroundColor: '#1a1a1a' }}>
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Consulta el Códice…"
                    rows={1}
                    className="flex-1 resize-none font-inter text-[13px] outline-none rounded-md transition-all"
                    style={{
                      backgroundColor: '#121212',
                      border: `1px solid ${input ? accentBorder : 'rgba(255,255,255,0.07)'}`,
                      color: '#e5e2e1',
                      padding: '8px 12px',
                      maxHeight: '80px',
                      lineHeight: '1.5',
                    }}
                    onFocus={e => { e.target.style.borderColor = accentBorder; e.target.style.boxShadow = `0 0 0 2px ${accentGlow}` }}
                    onBlur={e => { if (!input) { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none' } }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="rounded-md transition-all duration-150 shrink-0"
                    style={{
                      padding: '8px 10px',
                      backgroundColor: input.trim() && !isTyping ? accentColor : 'rgba(255,255,255,0.05)',
                      color: input.trim() && !isTyping ? '#e5e2e1' : '#444748',
                      border: 'none',
                      cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                    }}
                    onMouseEnter={e => { if (input.trim() && !isTyping) e.currentTarget.style.filter = 'brightness(1.15)' }}
                    onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                  >
                    <IconSend />
                  </button>
                </div>
                <p className="font-inter text-[10px] mt-1.5 text-center" style={{ color: '#2a2a2a' }}>
                  Enter para enviar · Shift+Enter para nueva línea
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Botón flotante ───────────────────────────────────── */}
      <button
        onClick={isOpen ? () => setIsOpen(false) : handleOpen}
        className="fixed z-50 rounded-full transition-all duration-200"
        style={{
          bottom: '24px',
          right: '24px',
          width: '52px',
          height: '52px',
          backgroundColor: isOpen ? '#2a2a2a' : accentColor,
          border: `1px solid ${accentBorder}`,
          boxShadow: isOpen
            ? `0 4px 16px rgba(0,0,0,0.5)`
            : `0 4px 24px ${accentGlow}, 0 0 0 1px ${accentBorder}`,
          color: isOpen ? '#6b7280' : '#e5e2e1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'scale(1.05)' }}
        onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'scale(1)' }}
        title={isOpen ? 'Cerrar Oráculo' : 'Consultar el Oráculo'}
      >
        {isOpen ? <IconClose /> : <IconEye />}

        {/* Notificación (sin leer) */}
        {!isOpen && messages.length > 1 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#c62828', fontSize: '9px', color: '#fff', fontFamily: 'Inter', fontWeight: '600' }}>
            {Math.min(messages.filter(m => m.role === 'oracle').length, 9)}
          </div>
        )}
      </button>

      {/* Keyframe de animación */}
      <style>{`
        @keyframes oracle-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
