import { useState } from 'react'
import DotRating from '../components/ui/DotRating.jsx'
import Button from '../components/ui/Button.jsx'

/* ── Mock data — coterie V20 ────────────────────────────────── */
const INITIAL_CHARACTERS = [
  {
    id: 1, name: 'Julian', clan: 'Toreador',
    bloodPool: { current: 10, max: 10 },
    willpower: { current: 6, max: 7 },
    health: { bruised: false, hurt: false, injured: false, wounded: true, mauled: false, crippled: false },
    avatar: null,
  },
  {
    id: 2, name: 'Marcus', clan: 'Brujah',
    bloodPool: { current: 12, max: 15 },
    willpower: { current: 3, max: 5 },
    health: { bruised: false, hurt: false, injured: false, wounded: false, mauled: false, crippled: false },
    avatar: null,
  },
]

const HEALTH_LEVELS = [
  { key: 'bruised',   label: 'Magullado',   mod: '' },
  { key: 'hurt',      label: 'Lastimado',   mod: '-1' },
  { key: 'injured',   label: 'Lesionado',   mod: '-1' },
  { key: 'wounded',   label: 'Herido',      mod: '-2' },
  { key: 'mauled',    label: 'Destrozado',  mod: '-2' },
  { key: 'crippled',  label: 'Lisiado',     mod: '-5' },
]

const FRENZY_TRIGGERS = [
  'Hambre extrema (Dif. 4–8)',
  'Humillación pública (Dif. 4)',
  'Peligro de muerte (Dif. 7)',
  'Sabor de sangre (Dif. 8)',
]
const ROTSCHRECK_TRIGGERS = [
  'Luz solar directa (Dif. 8)',
  'Fuego cercano (Dif. 6)',
  'Quedar atrapado (Dif. 6)',
]

const NOTES_INITIAL = `– Reunión clandestina confirmada en el Muelle 9, medianoche.
– El contacto Nosferatu (Garras) mencionó un cargamento inusual de tierra llegando desde el este de Europa.
– Marcus está al borde del frenesí por el incidente en el Elysium. Necesita calmarse o el Príncipe tomará medidas.
– Julian fue visto hablando con un neófito Tremere. Posible filtración de información sobre la ruta de contrabando.

Recordatorio: La luna está casi llena. Los Lupinos estarán inquietos en los límites de la ciudad.`

/* ── BloodPool dots ─────────────────────────────────────────── */
function BloodPool({ current, max }) {
  const rows = []
  let remaining = max
  while (remaining > 0) {
    rows.push(Math.min(remaining, 10))
    remaining -= 10
  }
  let dotIndex = 0
  return (
    <div className="space-y-0.5">
      {rows.map((rowCount, ri) => (
        <div key={ri} className="flex gap-0.5">
          {Array.from({ length: rowCount }, (_, ci) => {
            const idx = ri * 10 + ci
            const filled = idx < current
            return (
              <div key={ci} className={`w-2.5 h-2.5 rounded-full border shrink-0 ${
                filled ? 'bg-[#f87171] border-[#f87171]' : 'bg-transparent border-[#444748]'
              }`} />
            )
          })}
        </div>
      ))}
    </div>
  )
}

/* ── Character card ─────────────────────────────────────────── */
function CharacterCard({ char }) {
  return (
    <div className="bg-[#1c1b1b] border border-white/[0.06] rounded p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded bg-[#353434] border border-white/[0.08] shrink-0
                        flex items-center justify-center text-[#6b7280] text-xs font-inter font-semibold">
          {char.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-[15px] font-inter font-semibold text-[#e5e2e1]">{char.name}</p>
          <p className="text-[12px] text-[#9ca3af] font-inter italic">{char.clan}</p>
        </div>
      </div>

      {/* Blood pool */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="label-caps text-[#9ca3af]">Reserva de Sangre</span>
          <span className="text-[11px] text-[#9ca3af] font-mono">
            {char.bloodPool.current}/{char.bloodPool.max}
          </span>
        </div>
        <BloodPool current={char.bloodPool.current} max={char.bloodPool.max} />
      </div>

      {/* Willpower */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="label-caps text-[#9ca3af]">Fuerza de Voluntad</span>
          <span className="text-[11px] text-[#9ca3af] font-mono">
            {char.willpower.current}/{char.willpower.max}
          </span>
        </div>
        <DotRating value={char.willpower.current} max={char.willpower.max} color="muted" size="sm" />
      </div>

      {/* Health */}
      <div>
        <span className="label-caps text-[#9ca3af] block mb-2">Salud</span>
        <div className="space-y-1">
          {HEALTH_LEVELS.map(lvl => {
            const isDamaged = char.health[lvl.key]
            return (
              <div key={lvl.key} className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${
                  isDamaged
                    ? 'bg-[#8b1a1a] border-[#c62828]'
                    : 'bg-transparent border-[#444748]'
                }`}>
                  {isDamaged && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 1.5L6.5 6.5M6.5 1.5L1.5 6.5" stroke="#f87171" strokeWidth="1.2"/>
                    </svg>
                  )}
                </div>
                <span className={`text-[12px] font-inter flex-1 ${
                  isDamaged ? 'line-through text-[#6b7280]' : 'text-[#c4c7c8]'
                }`}>{lvl.label}</span>
                {lvl.mod && (
                  <span className="text-[11px] text-[#6b7280] font-mono">{lvl.mod}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Dice Roller ────────────────────────────────────────────── */
function DiceRoller() {
  const [difficulty, setDifficulty] = useState(6)
  const [pool, setPool] = useState(5)
  const [result, setResult] = useState(null)

  const roll = () => {
    const dice = Array.from({ length: pool }, () => Math.ceil(Math.random() * 10))
    const successes = dice.filter(d => d >= difficulty).length
    const ones = dice.filter(d => d === 1).length
    const net = successes - ones
    setResult({ dice, successes, ones, net, botch: net < 0 && ones > 0 })
  }

  return (
    <div className="bg-[#1c1b1b] border border-white/[0.06] rounded p-4">
      <h3 className="font-playfair text-[14px] font-semibold text-[#e5e2e1] mb-3">
        Resolución de Conflictos
      </h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="label-caps text-[#9ca3af] block mb-1">Dificultad</label>
          <div className="flex items-center gap-2 bg-[#201f1f] border border-[#444748] rounded px-2 py-1.5">
            <button onClick={() => setDifficulty(d => Math.max(2, d - 1))}
              className="text-[#9ca3af] hover:text-[#e5e2e1] w-4 text-center">–</button>
            <span className="flex-1 text-center text-[16px] font-inter font-semibold text-[#e5e2e1]">
              {difficulty}
            </span>
            <button onClick={() => setDifficulty(d => Math.min(10, d + 1))}
              className="text-[#9ca3af] hover:text-[#e5e2e1] w-4 text-center">+</button>
          </div>
        </div>
        <div>
          <label className="label-caps text-[#9ca3af] block mb-1">Reserva</label>
          <div className="flex items-center gap-2 bg-[#201f1f] border border-[#444748] rounded px-2 py-1.5">
            <button onClick={() => setPool(p => Math.max(1, p - 1))}
              className="text-[#9ca3af] hover:text-[#e5e2e1] w-4 text-center">–</button>
            <span className="flex-1 text-center text-[16px] font-inter font-semibold text-[#e5e2e1]">
              {pool}
            </span>
            <button onClick={() => setPool(p => Math.min(15, p + 1))}
              className="text-[#9ca3af] hover:text-[#e5e2e1] w-4 text-center">+</button>
          </div>
        </div>
      </div>
      <button onClick={roll}
        className="w-full btn-ghost py-2 flex items-center justify-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
          <circle cx="4" cy="4" r="0.8" fill="currentColor"/>
          <circle cx="7" cy="7" r="0.8" fill="currentColor"/>
          <circle cx="10" cy="10" r="0.8" fill="currentColor"/>
          <circle cx="10" cy="4" r="0.8" fill="currentColor"/>
          <circle cx="4" cy="10" r="0.8" fill="currentColor"/>
        </svg>
        Tirar Dados
      </button>
      {result && (
        <div className={`mt-3 p-3 rounded border text-center ${
          result.botch
            ? 'bg-[#8b1a1a]/20 border-[#c62828]/30'
            : result.net > 0
            ? 'bg-[#14532d]/20 border-[#16a34a]/30'
            : 'bg-[#353434] border-white/10'
        }`}>
          <p className={`text-[16px] font-inter font-bold ${
            result.botch ? 'text-[#f87171]' : result.net > 0 ? 'text-[#86efac]' : 'text-[#9ca3af]'
          }`}>
            {result.botch ? '⚡ Pifia' : result.net > 0 ? `${result.net} Éxito${result.net > 1 ? 's' : ''}` : 'Fracaso'}
          </p>
          <div className="flex justify-center gap-1 mt-2 flex-wrap">
            {result.dice.map((d, i) => (
              <span key={i} className={`text-[11px] font-mono w-5 h-5 rounded flex items-center justify-center ${
                d === 1 ? 'bg-[#8b1a1a]/40 text-[#f87171]' :
                d >= difficulty ? 'bg-[#14532d]/40 text-[#86efac]' :
                'bg-[#353434] text-[#6b7280]'
              }`}>{d}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── PantallaNarrador View ──────────────────────────────────── */
export default function PantallaNarrador() {
  const [notes, setNotes] = useState(NOTES_INITIAL)
  const [savedAt, setSavedAt] = useState('Guardado hace 2 min')

  const handleNotesChange = (e) => {
    setNotes(e.target.value)
    setSavedAt('Sin guardar…')
    setTimeout(() => setSavedAt('Guardado'), 1000)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-8 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 className="font-playfair text-[26px] font-bold text-[#e5e2e1] leading-tight">
          Pantalla del Narrador
        </h1>
        <p className="text-[12px] text-[#6b7280] font-inter mt-0.5">
          Crónica: Noches de Sangre &nbsp;|&nbsp; Sesión 14
        </p>
      </div>

      {/* Three-column layout */}
      <div className="flex-1 min-h-0 grid grid-cols-[280px_1fr_260px] divide-x divide-white/[0.04]">

        {/* Col 1 — Estado de la Coterie */}
        <div className="overflow-y-auto scrollable px-5 py-5 space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M1 13C1 11.343 3.239 10 6 10C8.761 10 11 11.343 11 13"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M11 10C12.657 10 15 10.895 15 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Estado de la Coterie
          </h2>
          {INITIAL_CHARACTERS.map(char => (
            <CharacterCard key={char.id} char={char} />
          ))}
        </div>

        {/* Col 2 — Bloc de Notas */}
        <div className="flex flex-col overflow-hidden px-6 py-5">
          <h2 className="section-title flex items-center gap-2 mb-4 shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <line x1="5" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              <line x1="5" y1="7.5" x2="11" y2="7.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
              <line x1="5" y1="10" x2="9" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
            </svg>
            Bloc de Notas
          </h2>
          <div className="flex-1 min-h-0 bg-[#1c1b1b] border border-white/[0.06] rounded flex flex-col">
            <textarea
              value={notes}
              onChange={handleNotesChange}
              className="flex-1 w-full bg-transparent resize-none p-4
                         font-playfair italic text-[14px] text-[#c4c7c8] leading-relaxed
                         outline-none placeholder:text-[#6b7280] scrollable"
              placeholder="Escribe las notas de la sesión..."
              spellCheck={false}
            />
            <div className="shrink-0 flex items-center justify-between px-4 py-2"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[11px] text-[#6b7280] font-inter">{savedAt}</span>
              <div className="flex gap-2">
                <button className="text-[#9ca3af] hover:text-[#e5e2e1] text-[11px] font-inter font-semibold transition-colors">B</button>
                <button className="text-[#9ca3af] hover:text-[#e5e2e1] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <line x1="3" y1="3" x2="11" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="3" y1="6" x2="9" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="3" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="3" y1="12" x2="7" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Col 3 — Acceso Rápido */}
        <div className="overflow-y-auto scrollable px-5 py-5 space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L10 6H15L11 9.5L12.5 15L8 12L3.5 15L5 9.5L1 6H6L8 1Z"
                stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            Acceso Rápido
          </h2>

          <DiceRoller />

          {/* Frenesí y Rötschreck */}
          <div className="bg-[#1c1b1b] border border-white/[0.06] rounded p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#f87171] animate-pulse-blood"/>
              <h3 className="font-playfair text-[14px] font-semibold text-[#f87171]">
                Frenesí y Rötschreck
              </h3>
            </div>

            <div>
              <p className="label-caps text-[#6b7280] mb-2">Provocación de Frenesí</p>
              <ul className="space-y-1.5">
                {FRENZY_TRIGGERS.map(t => (
                  <li key={t} className="flex items-start gap-2 text-[12px] text-[#c4c7c8] font-inter">
                    <span className="text-[#f87171] shrink-0 mt-0.5">·</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
              <p className="label-caps text-[#6b7280] mb-2">Rötschreck (Miedo Rojo)</p>
              <ul className="space-y-1.5">
                {ROTSCHRECK_TRIGGERS.map(t => (
                  <li key={t} className="flex items-start gap-2 text-[12px] text-[#c4c7c8] font-inter">
                    <span className="text-[#6b7280] shrink-0">▪</span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-3 px-3 py-2 rounded border border-white/[0.06] bg-[#201f1f]
                              text-center text-[11px] text-[#9ca3af] font-inter">
                Tirada: Autocontrol / Coraje
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
