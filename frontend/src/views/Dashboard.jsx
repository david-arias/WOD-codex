import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'

/* ── Mock data — una crónica por línea de juego ─────────────── */
const MOCK_CHRONICLES = [
  {
    id: 'cronica-1',
    title: 'Chicago by Night',
    gameLine: 'V20',
    gameLineLabel: 'Vampiro V20',
    faction: 'blood',
    players: 4,
    lastPlayed: 'Hace 2 días',
    status: 'active',
    tagline: 'La Camarilla tiembla. El Príncipe ha desaparecido.',
  },
  {
    id: 'cronica-2',
    title: 'Ecos del Túmulo',
    gameLine: 'W20',
    gameLineLabel: 'Hombre Lobo W20',
    faction: 'amber',
    players: 5,
    lastPlayed: 'Hace 1 semana',
    status: 'active',
    tagline: 'El Kaos brama en la distancia. La manada debe elegir.',
  },
  {
    id: 'cronica-3',
    title: 'Umbra Aeterna',
    gameLine: 'M20',
    gameLineLabel: 'Mago M20',
    faction: 'arcane',
    players: 3,
    lastPlayed: 'Hace 3 días',
    status: 'active',
    tagline: 'La Paradoja acecha a quienes doblan la realidad.',
  },
]

const FACTION_LABELS = {
  blood:  { badge: 'blood',  dot: '●' },
  amber:  { badge: 'amber',  dot: '●' },
  arcane: { badge: 'arcane', dot: '●' },
}

/* ── Icono de tres puntos ───────────────────────────────────── */
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

/* ── Chronicle Card ─────────────────────────────────────────── */
function ChronicleCard({ chronicle, onClick }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <Card
      faction={chronicle.faction}
      onClick={onClick}
      className="flex flex-col h-52 relative overflow-hidden group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <Badge variant={FACTION_LABELS[chronicle.faction].badge}>
          {chronicle.gameLineLabel}
        </Badge>
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
          className="text-[#6b7280] hover:text-[#c4c7c8] transition-colors p-0.5 rounded"
        >
          <IconDots />
        </button>
      </div>

      {/* Title */}
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
          <span className="text-[12px] font-inter">{chronicle.players} Jugadores</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#6b7280]">
          <IconClock />
          <span className="text-[12px] font-inter">{chronicle.lastPlayed}</span>
        </div>
      </div>
    </Card>
  )
}

/* ── Empty State Card ───────────────────────────────────────── */
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

/* ── Dashboard View ─────────────────────────────────────────── */
export default function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="flex items-start justify-between px-8 pt-8 pb-6 shrink-0">
        <div>
          <h1 className="font-playfair text-[32px] font-semibold text-[#e5e2e1] leading-tight">
            Crónicas Activas
          </h1>
          <p className="text-[14px] text-[#9ca3af] font-inter mt-1">
            Gestiona tus campañas y narrativas en curso.
          </p>
        </div>
        <Button
          variant="ghost"
          icon={<IconPlus />}
          onClick={() => {}}
        >
          Nueva Crónica
        </Button>
      </div>

      {/* Chronicles grid */}
      <div className="flex-1 px-8 pb-8 overflow-y-auto scrollable">
        <div className="grid grid-cols-3 gap-4">
          {MOCK_CHRONICLES.map(chronicle => (
            <ChronicleCard
              key={chronicle.id}
              chronicle={chronicle}
              onClick={() => navigate(`/cronica/${chronicle.id}`)}
            />
          ))}
          <EmptyCard onCreate={() => {}} />
        </div>

        {/* Section divider — Archivadas */}
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="label-caps text-[#6b7280]">Archivadas</span>
            <div className="flex-1 h-px bg-white/[0.04]" />
          </div>
          <p className="text-[13px] text-[#444748] font-inter italic">
            No hay crónicas archivadas.
          </p>
        </div>
      </div>
    </div>
  )
}
