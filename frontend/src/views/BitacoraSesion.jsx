import { useState } from 'react'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'

/* ── Mock transcription ─────────────────────────────────────── */
const MOCK_TRANSCRIPT = [
  `"La lluvia azota los adoquines del callejón trasero de 'The Asylum'. El olor a ozono y sangre vieja es inconfundible. Marcus se detiene bajo la luz parpadeante de una farola de sodio, la cual arroja sombras alargadas y monstruosas contra la pared de ladrillo desconchado. 'Sabes que no deberías estar aquí', gruñe una voz desde la oscuridad, apenas audible sobre el trueno."`,
  `"Marcus no se inmuta. Saca lentamente su encendedor de plata, el sonido del clic reverberando extrañamente. 'Y tú sabes que no me iré sin respuestas', responde, su bestia arañando la superficie, exigiendo violencia."`,
  `"El extraño emerge finalmente. Es un Nosferatu, las cicatrices de su rostro torcidas en una sonrisa burlona. 'Respuestas cuestan sangre, chiquillo. ¿Cuánta estás dispuesto a derramar?'"`,
]

/* ── Mock AI-detected events ────────────────────────────────── */
const MOCK_EVENTS = [
  {
    id: 1,
    label: '–1 Humanidad',
    type: 'blood',
    icon: '♥',
    description: 'Acción diablería implícita',
  },
  {
    id: 2,
    label: '+2 Rabia a Marcus',
    type: 'amber',
    icon: '🔥',
    description: 'Provocación de la Bestia',
  },
  {
    id: 3,
    label: 'Nueva Resonancia: Melancolía',
    type: 'arcane',
    icon: '◇',
    description: 'Estado emocional del ambiente',
  },
  {
    id: 4,
    label: 'Posible Ruptura del Velo',
    type: 'warning',
    icon: '⚠',
    description: 'Testigos civiles en la escena',
  },
]

const EVENT_STYLES = {
  blood:   { border: '#c62828', bg: 'rgba(139,26,26,0.15)', text: '#f87171', iconColor: '#f87171' },
  amber:   { border: '#d97706', bg: 'rgba(146,64,14,0.15)', text: '#fbbf24', iconColor: '#fbbf24' },
  arcane:  { border: '#7c3aed', bg: 'rgba(76,29,149,0.15)', text: '#a78bfa', iconColor: '#a78bfa' },
  warning: { border: '#d97706', bg: 'rgba(120,53,15,0.12)', text: '#fde68a', iconColor: '#fbbf24' },
}

/* ── Mic button ─────────────────────────────────────────────── */
function MicButton({ isRecording, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={[
        'w-24 h-24 rounded-xl flex items-center justify-center transition-all duration-300',
        'border-2 relative overflow-hidden',
        isRecording
          ? 'border-[#f87171] bg-[#8b1a1a]/30 shadow-[0_0_32px_rgba(198,40,40,0.5)]'
          : 'border-[#444748] bg-[#201f1f] hover:border-[rgba(229,226,225,0.3)] hover:bg-[#2a2a2a]',
      ].join(' ')}
    >
      {isRecording && (
        <div className="absolute inset-0 rounded-xl border-2 border-[#f87171]/40 animate-ping" />
      )}
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="12" y="4" width="12" height="20" rx="6"
          fill={isRecording ? '#f87171' : 'none'}
          stroke={isRecording ? '#f87171' : '#9ca3af'}
          strokeWidth="1.8"/>
        <path d="M6 18C6 24.627 11.373 30 18 30C24.627 30 30 24.627 30 18"
          stroke={isRecording ? '#f87171' : '#9ca3af'}
          strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="18" y1="30" x2="18" y2="34"
          stroke={isRecording ? '#f87171' : '#9ca3af'}
          strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="13" y1="34" x2="23" y2="34"
          stroke={isRecording ? '#f87171' : '#9ca3af'}
          strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </button>
  )
}

/* ── EventBadge ─────────────────────────────────────────────── */
function EventBadge({ event }) {
  const style = EVENT_STYLES[event.type] || EVENT_STYLES.warning
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded border transition-all duration-200 hover:brightness-110 cursor-default"
      style={{ background: style.bg, borderColor: style.border + '55' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-[16px]" style={{ color: style.iconColor }}>
          {event.icon}
        </span>
        <div>
          <p className="text-[13px] font-inter font-semibold" style={{ color: style.text }}>
            [{event.label}]
          </p>
          {event.description && (
            <p className="text-[11px] text-[#6b7280] font-inter mt-0.5">{event.description}</p>
          )}
        </div>
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        {event.type === 'blood' ? (
          <path d="M8 2C8 2 3 7 3 10C3 12.761 5.239 15 8 15C10.761 15 13 12.761 13 10C13 7 8 2 8 2Z"
            stroke={style.iconColor} strokeWidth="1.2" strokeLinejoin="round"/>
        ) : event.type === 'amber' ? (
          <circle cx="8" cy="8" r="5" stroke={style.iconColor} strokeWidth="1.2"/>
        ) : event.type === 'arcane' ? (
          <path d="M8 1L8 15M1 8L15 8M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5"
            stroke={style.iconColor} strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
        ) : (
          <path d="M8 3L14 13H2L8 3Z" stroke={style.iconColor} strokeWidth="1.2"
            strokeLinejoin="round"/>
        )}
      </svg>
    </div>
  )
}

/* ── BitacoraSesion View ─────────────────────────────────────── */
export default function BitacoraSesion() {
  const [isRecording, setIsRecording] = useState(false)
  const [events, setEvents] = useState(MOCK_EVENTS)

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header + Mic */}
      <div className="shrink-0 flex flex-col items-center py-7 px-8"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 className="font-playfair text-[22px] font-semibold text-[#e5e2e1] mb-5">
          Bitácora de Sesión
        </h1>
        <MicButton isRecording={isRecording} onToggle={() => setIsRecording(r => !r)} />
        <p className={`mt-3 label-caps transition-colors duration-300 ${
          isRecording ? 'text-[#f87171]' : 'text-[#6b7280]'
        }`}>
          {isRecording ? '● Grabando...' : 'Grabar Resumen de Sesión'}
        </p>
      </div>

      {/* Two-panel content */}
      <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-white/[0.05] overflow-hidden">

        {/* Left — Transcripción */}
        <div className="flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="shrink-0 flex items-center gap-2 px-6 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="1.5" stroke="#9ca3af" strokeWidth="1.1"/>
              <line x1="3.5" y1="4.5" x2="10.5" y2="4.5" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round"/>
              <line x1="3.5" y1="7" x2="10.5" y2="7" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round"/>
              <line x1="3.5" y1="9.5" x2="7.5" y2="9.5" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            <span className="label-caps text-[#9ca3af]">Transcripción</span>
          </div>

          {/* Transcript content */}
          <div className="flex-1 overflow-y-auto scrollable px-6 py-5 space-y-5">
            {MOCK_TRANSCRIPT.map((paragraph, i) => (
              <p key={i}
                className="font-playfair italic text-[14px] text-[#c4c7c8] leading-relaxed">
                {paragraph}
              </p>
            ))}
            {isRecording && (
              <div className="flex items-center gap-2 text-[12px] text-[#9ca3af] font-inter animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f87171]" />
                Capturando narración...
              </div>
            )}
            <p className="text-[#444748] font-inter text-center text-[16px] tracking-widest">···</p>
          </div>
        </div>

        {/* Right — Eventos y Consecuencias */}
        <div className="flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="#9ca3af" strokeWidth="1.1"/>
                <path d="M7 4V7L9.5 9.5" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round"/>
              </svg>
              <span className="label-caps text-[#9ca3af]">Eventos y Consecuencias</span>
            </div>
            <Badge variant="active" dot size="sm">AI Scan Active</Badge>
          </div>

          {/* Events list */}
          <div className="flex-1 overflow-y-auto scrollable px-5 py-5">
            <p className="label-caps text-[#6b7280] mb-3">
              Entidades Mecánicas Detectadas:
            </p>
            <div className="space-y-2.5">
              {events.map(event => (
                <EventBadge key={event.id} event={event} />
              ))}
            </div>
          </div>

          {/* Apply button */}
          <div className="shrink-0 p-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <Button variant="ghost" className="w-full justify-center py-2.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="2" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 6L6 8L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Aplicar a Fichas
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
