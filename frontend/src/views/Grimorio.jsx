import { useState, useRef, useEffect } from 'react'
import Badge from '../components/ui/Badge.jsx'

/* ── Mock — entrada del Grimorio activa ─────────────────────── */
const MOCK_RULE = {
  breadcrumb: ['Mago: La Ascensión 20th Anniversary', 'Capítulo 8: Sistemas'],
  title: 'Reglas de Paradoja',
  subtitle: 'El Efecto Observador y el Retroceso de la Realidad.',
  body: [
    `Cuando un Mago altera la realidad de forma evidente, la Consensualidad se defiende. Este contragolpe se denomina Paradoja. Es la fricción entre la Voluntad del Despertado y las creencias colectivas de los Durmientes.`,
  ],
  quote: {
    title: 'Generación de Puntos de Paradoja',
    items: [
      { label: 'Efecto Coincidente:', text: 'No genera Paradoja si tiene éxito. Si falla, genera 1 punto por Esfera más alta involucrada.' },
      { label: 'Efecto Vulgar (Sin Testigos):', text: 'Genera 1 punto base + 1 por Esfera más alta (incluso si tiene éxito).' },
      { label: 'Efecto Vulgar (Con Testigos):', text: 'Genera 1 punto por Esfera más alta + 1 extra por cada éxito en la tirada (éxito o fracaso).' },
    ],
  },
  body2: `Los puntos de Paradoja se acumulan en la Rueda de Paradoja del personaje. Cuando la reserva alcanza ciertos umbrales, el Narrador debe tirar los dados de Paradoja para determinar si ocurre un Estallido (Backlash).`,
  section2: 'Consecuencias del Estallido',
  body3: `Un Estallido de Paradoja libera la energía acumulada de forma violenta o sutil, dependiendo de las circunstancias...`,
}

/* ── Mock — conversación del Oráculo ───────────────────────── */
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'user',
    content: '¿Qué pasa si lanzo una bola de fuego en medio de Times Square y saco un fracaso?',
    time: '10:42 PM',
  },
  {
    id: 2,
    role: 'assistant',
    narrative: 'Los transeúntes observan horrorizados cómo tu voluntad choca contra el muro de granito del consenso moderno. La realidad se resquebraja violentamente...',
    content: `Lanzar una bola de fuego (Fuerzas 3 / Cardinal 2) en Times Square es un Efecto Vulgar con Testigos.\n\n"Si un Mago fracasa en una tirada de Magia Vulgar frente a Testigos, el contragolpe es catastrófico."\n— M20 Corebook, p. 504\n\nAl ser un fracaso, generas: 1 punto por Esfera más alta (3) + 1 por cada 1 en el dado que causó el fracaso + 1 base por ser vulgar. Además, al ser un fracaso en magia vulgar con testigos, la Paradoja acumulada estalla de inmediato.`,
    time: '10:42 PM',
  },
]

const SUGGESTION_CHIPS = ['Esferas', 'Combate', 'Creación de personaje']

const IconOracle = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1Z"
      stroke="#a78bfa" strokeWidth="1.2"/>
    <path d="M8 5V8.5L10 10.5" stroke="#a78bfa" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="8" cy="8" r="1" fill="#a78bfa" fillOpacity="0.4"/>
  </svg>
)
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M14 8L2 2L5.5 8L2 14L14 8Z" stroke="currentColor" strokeWidth="1.3"
      strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/>
  </svg>
)

/* ── OracleMessage ──────────────────────────────────────────── */
function OracleMessage({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] bg-[#2a2a2a] rounded px-3.5 py-2.5 border border-white/[0.06]">
          <p className="text-[13px] text-[#e5e2e1] font-inter leading-relaxed">{msg.content}</p>
          <p className="text-[10px] text-[#6b7280] font-inter mt-1.5 text-right">{msg.time}</p>
        </div>
      </div>
    )
  }

  const lines = msg.content.split('\n\n')
  return (
    <div className="flex gap-2.5">
      <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-[#4c1d95]/30 border border-[#7c3aed]/30
                      flex items-center justify-center">
        <IconOracle />
      </div>
      <div className="flex-1 space-y-2">
        {msg.narrative && (
          <p className="text-[13px] text-[#9ca3af] font-playfair italic leading-relaxed">
            {msg.narrative}
          </p>
        )}
        {lines.map((line, i) => {
          if (line.startsWith('—')) {
            return (
              <p key={i} className="text-[11px] text-[#6b7280] font-inter italic border-l border-[#7c3aed]/30 pl-2.5">
                {line}
              </p>
            )
          }
          if (line.startsWith('"')) {
            return (
              <blockquote key={i}
                className="border-l-2 border-[#7c3aed]/50 pl-3 text-[13px] text-[#c4c7c8] font-inter italic">
                {line}
              </blockquote>
            )
          }
          return (
            <p key={i} className="text-[13px] text-[#c4c7c8] font-inter leading-relaxed">
              {line}
            </p>
          )
        })}
        <p className="text-[10px] text-[#6b7280] font-inter">{msg.time}</p>
      </div>
    </div>
  )
}

/* ── Grimorio View ──────────────────────────────────────────── */
export default function Grimorio() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
    }])
    setInput('')
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Panel izquierdo — Contenido de la regla ─────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto scrollable px-10 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          {MOCK_RULE.breadcrumb.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-2">
              {i > 0 && <span className="text-[#444748]">/</span>}
              <Badge variant={i === 0 ? 'ghost' : 'arcane'} size="sm">{crumb}</Badge>
            </span>
          ))}
        </div>

        {/* Título principal */}
        <h1 className="font-playfair text-[38px] font-bold text-[#e5e2e1] leading-tight mb-2">
          {MOCK_RULE.title}
        </h1>
        <p className="font-playfair italic text-[16px] text-[#9ca3af] mb-6">
          {MOCK_RULE.subtitle}
        </p>

        <div className="h-px bg-white/[0.06] mb-6" />

        {/* Cuerpo */}
        {MOCK_RULE.body.map((p, i) => (
          <p key={i} className="text-[15px] text-[#c4c7c8] font-inter leading-relaxed mb-4">
            {p}
          </p>
        ))}

        {/* Quote / Table box */}
        <div className="bg-[#201f1f] border border-white/[0.08] rounded p-5 mb-6">
          <h3 className="font-playfair text-[17px] font-semibold text-[#e5e2e1] mb-4">
            {MOCK_RULE.quote.title}
          </h3>
          <ul className="space-y-2.5">
            {MOCK_RULE.quote.items.map((item, i) => (
              <li key={i} className="flex gap-2 text-[14px] font-inter text-[#c4c7c8] leading-relaxed">
                <span className="text-[#a78bfa] shrink-0 mt-0.5">·</span>
                <span>
                  <strong className="text-[#e5e2e1]">{item.label}</strong>{' '}
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[15px] text-[#c4c7c8] font-inter leading-relaxed mb-6">
          {MOCK_RULE.body2}
        </p>

        <h2 className="font-playfair text-[24px] font-semibold text-[#e5e2e1] mb-3">
          {MOCK_RULE.section2}
        </h2>
        <p className="text-[15px] text-[#c4c7c8] font-inter leading-relaxed">
          {MOCK_RULE.body3}
        </p>
      </div>

      {/* ── Panel derecho — Oráculo AI ─────────────────────── */}
      <div
        className="w-[360px] shrink-0 flex flex-col h-full"
        style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Header */}
        <div
          className="shrink-0 flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2.5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5C4.86 1.5 1.5 4.86 1.5 9C1.5 13.14 4.86 16.5 9 16.5C13.14 16.5 16.5 13.14 16.5 9C16.5 4.86 13.14 1.5 9 1.5ZM9 6L12 9L9 12L6 9L9 6Z"
                stroke="#a78bfa" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            <span className="font-playfair text-[15px] font-semibold text-[#e5e2e1]">
              Oráculo AI
            </span>
          </div>
          <Badge variant="arcane" dot size="sm">RAG Activo</Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollable px-4 py-4 space-y-5">
          {messages.map(msg => (
            <OracleMessage key={msg.id} msg={msg} />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion chips */}
        <div className="shrink-0 px-4 py-2 flex gap-2 flex-wrap"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {SUGGESTION_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => setInput(chip)}
              className="px-2.5 py-1 rounded-full border border-white/10
                         text-[11px] font-inter text-[#9ca3af]
                         hover:border-[#7c3aed]/40 hover:text-[#a78bfa]
                         transition-all duration-150"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="flex items-center gap-2 bg-[#201f1f] rounded border border-[#444748]
                          focus-within:border-[rgba(167,139,250,0.4)] transition-colors px-3 py-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Consulta el Códice..."
              className="flex-1 bg-transparent text-[13px] text-[#e5e2e1] font-inter
                         placeholder:text-[#6b7280] outline-none"
            />
            <button
              onClick={handleSend}
              className="text-[#9ca3af] hover:text-[#a78bfa] transition-colors shrink-0"
            >
              <IconSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
