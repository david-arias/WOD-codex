import { useState } from 'react'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Button from '../components/ui/Button.jsx'
import DotRating from '../components/ui/DotRating.jsx'

/* ── Mock initial stats (M20 Euthanatos) ───────────────────── */
const INITIAL_STATS = {
  name: '',
  faction: 'tradiciones',
  tradition: 'eutanatos',
  concept: '',
  attributes: {
    physical: { strength: 2, dexterity: 3, stamina: 2 },
    social:   { charisma: 3, manipulation: 4, appearance: 2 },
    mental:   { perception: 3, intelligence: 4, wits: 3 },
  },
  spheres: {
    cardinal: 0, correspondence: 0, entropy: 3,
    spirit: 2, forces: 0, matter: 0,
    mind: 1, time: 2, life: 1,
  },
  arete: 4,
  quintessence: { current: 8, max: 20 },
  paradox: 2,
}

const FACTION_OPTIONS = [
  { value: 'tradiciones', label: 'Las Tradiciones' },
  { value: 'tecnocracia', label: 'La Tecnocracia' },
  { value: 'marauders',   label: 'Los Marauders' },
  { value: 'nephandus',   label: 'Nephandi' },
]

const TRADITION_OPTIONS = [
  { value: 'verbena',     label: 'Verbena' },
  { value: 'hermetica',   label: 'Orden Hermética' },
  { value: 'virtual',     label: 'Virtual Adept' },
  { value: 'sons',        label: 'Sons of Ether' },
  { value: 'akashic',     label: 'Akashic Brotherhood' },
  { value: 'chorus',      label: 'Celestial Chorus' },
  { value: 'ecstasy',     label: 'Cult of Ecstasy' },
  { value: 'dreamspeaker',label: 'Dreamspeakers' },
  { value: 'eutanatos',   label: 'Eutanatos' },
]

const ATTR_LABELS = {
  physical: { strength: 'Fuerza',   dexterity: 'Destreza',     stamina: 'Resistencia' },
  social:   { charisma: 'Carisma',  manipulation: 'Manipulación', appearance: 'Apariencia' },
  mental:   { perception: 'Percepción', intelligence: 'Inteligencia', wits: 'Astucia' },
}
const SPHERE_LABELS = {
  cardinal: 'Cardinal', correspondence: 'Correspondencia',
  entropy: 'Entropía', spirit: 'Espíritu', forces: 'Fuerzas',
  matter: 'Materia', mind: 'Mente', time: 'Tiempo', life: 'Vida',
}

/* ── Quintessence circular SVG ──────────────────────────────── */
function QuintessenceWheel({ current, max }) {
  const radius = 38
  const cx = 50; const cy = 50
  const total = max
  const filled = current
  const dotCount = 16
  const stepAngle = (2 * Math.PI) / dotCount

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="label-caps text-[#9ca3af]">Quintaesencia</span>
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {Array.from({ length: dotCount }, (_, i) => {
            const angle = -Math.PI / 2 + i * stepAngle
            const x = cx + radius * Math.cos(angle)
            const y = cy + radius * Math.sin(angle)
            const isFilled = i < Math.round((filled / max) * dotCount)
            return (
              <circle key={i} cx={x} cy={y} r="3.5"
                fill={isFilled ? '#a78bfa' : 'transparent'}
                stroke={isFilled ? '#a78bfa' : 'rgba(255,255,255,0.12)'}
                strokeWidth="1"/>
            )
          })}
          <text x="50" y="46" textAnchor="middle" dominantBaseline="middle"
            fill="#e5e2e1" fontSize="16" fontFamily="Inter" fontWeight="600">
            {current}
          </text>
          <text x="50" y="60" textAnchor="middle" dominantBaseline="middle"
            fill="#6b7280" fontSize="10" fontFamily="Inter">
            /{max}
          </text>
        </svg>
      </div>
    </div>
  )
}

/* ── Paradox tracker ────────────────────────────────────────── */
function ParadoxTracker({ value, max = 15 }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label-caps text-[#9ca3af]">Paradoja</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div key={i}
            className={`h-3 flex-1 rounded-sm border transition-colors ${
              i < value
                ? 'bg-[#f87171]/60 border-[#f87171]/40'
                : 'bg-transparent border-[#444748]'
            }`}
          />
        ))}
      </div>
      {value > 0 && (
        <p className="text-[11px] text-[#f87171] font-inter text-center">
          {value} {value === 1 ? 'punto' : 'puntos'} de mácula
        </p>
      )}
    </div>
  )
}

/* ── Forja View ─────────────────────────────────────────────── */
export default function Forja() {
  const [stats, setStats] = useState(INITIAL_STATS)

  const updateAttr = (group, attr, val) =>
    setStats(s => ({ ...s, attributes: {
      ...s.attributes,
      [group]: { ...s.attributes[group], [attr]: val }
    }}))

  const updateSphere = (sphere, val) =>
    setStats(s => ({ ...s, spheres: { ...s.spheres, [sphere]: val } }))

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Panel izquierdo — Formulario ────────────────────── */}
      <div className="w-[280px] shrink-0 flex flex-col h-full overflow-y-auto scrollable px-6 py-8 space-y-5"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>

        <div>
          <h1 className="font-playfair text-[26px] font-bold text-[#e5e2e1] leading-tight">
            Forja de Entidades
          </h1>
          <p className="text-[12px] text-[#6b7280] font-inter mt-1">
            Protocolo de Despertar: Clasificación M20.
          </p>
        </div>

        <div style={{ borderTop: '2px solid #7c3aed', paddingTop: '1.25rem' }} />

        <Input
          label="Nombre"
          value={stats.name}
          onChange={e => setStats(s => ({ ...s, name: e.target.value }))}
          placeholder="Identidad del Despertado..."
        />

        <Select
          label="Facción (Tradición)"
          value={stats.faction}
          onChange={e => setStats(s => ({ ...s, faction: e.target.value }))}
          options={FACTION_OPTIONS}
        />

        <Select
          label="Tradición Específica"
          value={stats.tradition}
          onChange={e => setStats(s => ({ ...s, tradition: e.target.value }))}
          options={TRADITION_OPTIONS}
        />

        <Input
          label="Concepto"
          value={stats.concept}
          onChange={e => setStats(s => ({ ...s, concept: e.target.value }))}
          placeholder="Ej: Investigador Ocultista"
        />

        {/* Image placeholder */}
        <div className="rounded border border-dashed border-[#444748] bg-[#201f1f]
                        h-36 flex flex-col items-center justify-center gap-2 cursor-pointer
                        hover:border-[#7c3aed]/50 transition-colors">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path d="M4 22L10 14L14 18L19 11L24 22H4Z" stroke="#9ca3af" strokeWidth="1.3"
              strokeLinejoin="round"/>
            <circle cx="9" cy="9" r="2.5" stroke="#9ca3af" strokeWidth="1.2"/>
          </svg>
          <span className="text-[11px] text-[#6b7280] font-inter">Imagen del personaje</span>
        </div>
      </div>

      {/* ── Panel derecho — Ficha del personaje ─────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto scrollable px-8 py-8">

        {/* Atributos */}
        <section className="mb-8">
          <h2 className="font-playfair text-[20px] font-semibold text-[#e5e2e1] mb-5">
            Atributos
          </h2>
          <div className="bg-[#1c1b1b] border border-white/[0.06] rounded p-5">
            <div className="grid grid-cols-3 gap-6">
              {(['physical', 'social', 'mental']).map(group => (
                <div key={group}>
                  <p className="label-caps text-[#9ca3af] mb-3 text-center">
                    { group === 'physical' ? 'Físicos' : group === 'social' ? 'Sociales' : 'Mentales' }
                  </p>
                  <div className="space-y-2.5">
                    {Object.entries(ATTR_LABELS[group]).map(([attr, label]) => (
                      <div key={attr} className="flex items-center justify-between gap-2">
                        <span className="text-[13px] text-[#c4c7c8] font-inter">{label}</span>
                        <DotRating
                          value={stats.attributes[group][attr]}
                          max={5}
                          color="white"
                          size="sm"
                          onClick={val => updateAttr(group, attr, val)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Esferas + Stats especiales */}
        <div className="grid grid-cols-[1fr_200px] gap-5">

          {/* Las 9 Esferas */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="font-playfair text-[20px] font-semibold text-[#e5e2e1]">
                Las 9 Esferas
              </h2>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="7.5" stroke="#a78bfa" strokeWidth="1.2"/>
                <path d="M9 1.5C9 1.5 13.5 6 13.5 9C13.5 12 9 16.5 9 16.5"
                  stroke="#a78bfa" strokeWidth="1" strokeLinecap="round"/>
                <path d="M9 1.5C9 1.5 4.5 6 4.5 9C4.5 12 9 16.5 9 16.5"
                  stroke="#a78bfa" strokeWidth="1" strokeLinecap="round"/>
                <line x1="1.5" y1="9" x2="16.5" y2="9" stroke="#a78bfa" strokeWidth="1"/>
              </svg>
            </div>
            <div className="bg-[#1c1b1b] border border-white/[0.06] rounded divide-y divide-white/[0.04]">
              {Object.entries(SPHERE_LABELS).map(([sphere, label]) => {
                const val = stats.spheres[sphere]
                const hasRating = val > 0
                return (
                  <div key={sphere}
                    className={`flex items-center justify-between px-4 py-2.5 ${
                      hasRating ? 'bg-[#2a1e4d]/20' : ''
                    }`}
                    style={hasRating ? { borderLeft: '2px solid #7c3aed' } : {}}
                  >
                    <span className={`text-[13px] font-inter ${hasRating ? 'text-[#e5e2e1]' : 'text-[#9ca3af]'}`}>
                      {label}
                    </span>
                    <DotRating
                      value={val}
                      max={5}
                      color="arcane"
                      size="sm"
                      onClick={v => updateSphere(sphere, v)}
                    />
                  </div>
                )
              })}
            </div>
          </section>

          {/* Areté + Quintaesencia + Paradoja */}
          <section className="flex flex-col gap-5">
            {/* Areté */}
            <div className="bg-[#1c1b1b] border border-white/[0.06] rounded p-4 flex flex-col items-center gap-2">
              <span className="label-caps text-[#9ca3af]">Areté</span>
              <DotRating value={stats.arete} max={10} color="arcane" size="md"
                onClick={v => setStats(s => ({ ...s, arete: v }))}
              />
            </div>

            {/* Quintaesencia */}
            <div className="bg-[#1c1b1b] border border-white/[0.06] rounded p-4 flex justify-center">
              <QuintessenceWheel
                current={stats.quintessence.current}
                max={stats.quintessence.max}
              />
            </div>

            {/* Paradoja */}
            <div className="bg-[#1c1b1b] border border-white/[0.06] rounded p-4">
              <ParadoxTracker value={stats.paradox} />
            </div>
          </section>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6 pt-5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Button variant="ghost">Regenerar Estadísticas</Button>
          <Button variant="arcane">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1V10M3 6L7 10L11 6" stroke="currentColor" strokeWidth="1.4"
                strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="1" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1.4"
                strokeLinecap="round"/>
            </svg>
            Guardar en Crónica
          </Button>
        </div>
      </div>
    </div>
  )
}
