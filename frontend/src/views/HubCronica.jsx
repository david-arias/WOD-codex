import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Card from '../components/ui/Card.jsx'

/* ── Mock data — crónica W20 ────────────────────────────────── */
const MOCK_CHRONICLE = {
  gameLineLabel: 'Crónica de Hombre Lobo: El Apocalipsis (W20)',
  title: 'Ecos del Túmulo',
  tagline: 'El Kaos brama en la distancia mientras las garras del Wyrm se ciernen sobre el protectorado. La manada debe decidir entre la tradición de los ancestros o la supervivencia en la era moderna.',
  faction: 'amber',
}

const THREATS = [
  {
    id: 1,
    tag: 'INFILTRACIÓN',
    tagVariant: 'ghost',
    title: 'Operaciones de Pentex',
    body: 'Subsidiaria O\'Tolley\'s detectada abriendo franquicias cerca del bosque de pinos negros. Aumento de incidentes de rabia en la fauna local.',
    status: 'Investigando',
    statusVariant: 'ghost',
    icon: '🏢',
  },
  {
    id: 2,
    tag: 'UMBRA',
    tagVariant: 'arcane',
    title: 'Espíritus Corruptos (Perdiciones)',
    body: 'El arroyo del ciervo místico está supurando un lodo negruzco en la penumbra. Los espíritus del agua locales están pidiendo ayuda o atacando a los Theurge.',
    status: 'Crítico',
    statusVariant: 'blood',
    icon: '💧',
    highlighted: true,
  },
]

const SESSIONS = [
  {
    id: 12,
    title: 'Sangre en el Asfalto',
    label: 'SESIÓN 12',
    time: 'Hace 2 días',
    body: 'La manada emboscó un convoy de transporte de Pentex. Kaelen entró en Frenesí y casi rompe el Velo frente a testigos civiles. El cargamento resultó ser tierra contaminada.',
    active: true,
  },
  {
    id: 11,
    title: 'El Moot de la Luna Llena',
    label: 'SESIÓN 11',
    time: '12 Oct',
    body: 'Tensiones políticas con la tribu Colmillos Plateados. Se acordó una tregua temporal para investigar la desaparición del parentela en el distrito sur.',
    active: false,
  },
  {
    id: 10,
    title: 'Ecos en la Penumbra',
    label: 'SESIÓN 10',
    time: '05 Oct',
    body: 'Primer cruce a la Umbra profunda. Negociación con un espíritu gnatca. Se descubre el origen del lodo en el arroyo.',
    active: false,
  },
]

const TABS = ['Resumen', 'La Manada', 'PNJs', 'Bitácora']

/* ── HubCronica View ────────────────────────────────────────── */
export default function HubCronica() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('Resumen')

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Page header */}
      <div className="shrink-0 px-8 pt-7 pb-0">
        <p className="label-caps text-[#d97706] mb-2 flex items-center gap-2">
          <span className="w-6 h-px bg-[#d97706]/50" />
          {MOCK_CHRONICLE.gameLineLabel}
        </p>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="font-playfair text-[38px] font-bold text-[#e5e2e1] leading-tight">
              {MOCK_CHRONICLE.title}
            </h1>
            <p className="text-[14px] text-[#9ca3af] font-inter leading-relaxed max-w-2xl mt-1">
              {MOCK_CHRONICLE.tagline}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 mt-1">
            <Button variant="ghost">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="4.4" y1="6.1" x2="9.6" y2="3.9" stroke="currentColor" strokeWidth="1.1"/>
                <line x1="4.4" y1="7.9" x2="9.6" y2="10.1" stroke="currentColor" strokeWidth="1.1"/>
              </svg>
            </Button>
            <Button variant="amber">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2L12 4.5L5 11.5H2.5V9L9.5 2Z" stroke="currentColor" strokeWidth="1.2"
                  strokeLinejoin="round"/>
              </svg>
              Editar Crónica
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={[
                'px-4 py-2.5 text-[13px] font-inter font-medium transition-all duration-150 relative',
                activeTab === tab
                  ? 'text-[#e5e2e1]'
                  : 'text-[#6b7280] hover:text-[#9ca3af]',
              ].join(' ')}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#d97706]" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content — two columns */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* Left column — Threats + Quote */}
        <div className="flex-1 min-w-0 overflow-y-auto scrollable px-8 py-6 space-y-5">

          {/* Amenazas Activas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L14 13H2L8 2Z" stroke="#d97706" strokeWidth="1.3"
                    fill="#d97706" fillOpacity="0.1" strokeLinejoin="round"/>
                  <line x1="8" y1="7" x2="8" y2="10" stroke="#d97706" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="8" cy="11.5" r="0.7" fill="#d97706"/>
                </svg>
                Amenazas Activas
              </h2>
              <Badge variant="amber" size="sm">Wyrm/Tejedora</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {THREATS.map(threat => (
                <div key={threat.id}
                  className={[
                    'rounded p-4 border transition-all duration-200',
                    threat.highlighted
                      ? 'bg-[#2e1065]/10 border-[#7c3aed]/40 shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                      : 'bg-[#1c1b1b] border-white/[0.06] hover:border-white/[0.12]',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge
                      variant={threat.tagVariant}
                      dot={threat.tagVariant !== 'ghost'}
                      size="sm"
                    >
                      {threat.tag}
                    </Badge>
                    <span className="text-[20px] opacity-30">{threat.icon}</span>
                  </div>
                  <h3 className="font-inter text-[14px] font-semibold text-[#e5e2e1] mb-1.5 leading-snug">
                    {threat.title}
                  </h3>
                  <p className="text-[12px] text-[#9ca3af] font-inter leading-relaxed">
                    {threat.body}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-[#353434] border border-[#1c1b1b]" />
                    </div>
                    <Badge variant={threat.statusVariant} size="sm">{threat.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Susurros del Anciano */}
          <div className="bg-[#1c1b1b] border border-[#d97706]/20 rounded p-5"
            style={{ borderLeft: '3px solid #d97706' }}>
            <p className="font-playfair text-[13px] font-semibold text-[#d97706] mb-2 italic">
              Susurros del Anciano
            </p>
            <blockquote className="font-playfair italic text-[14px] text-[#c4c7c8] leading-relaxed">
              "La luna mengua y con ella la paciencia de Gaia. No deis cuartel a las sanguijuelas de la ciudad, pero vigilad la podredumbre en vuestro propio patio."
            </blockquote>
          </div>
        </div>

        {/* Right column — Últimos Registros */}
        <div className="w-[300px] shrink-0 overflow-y-auto scrollable px-5 py-6"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-playfair text-[16px] font-semibold text-[#e5e2e1] flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Últimos Registros
            </h2>
            <button className="label-caps text-[#6b7280] hover:text-[#9ca3af] transition-colors text-[10px]">
              Ver todo
            </button>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[7px] top-2 bottom-0 w-px bg-white/[0.06]" />

            <div className="space-y-5">
              {SESSIONS.map(session => (
                <div key={session.id} className="flex gap-3 relative">
                  {/* Timeline dot */}
                  <div className={`shrink-0 w-3.5 h-3.5 rounded-full mt-0.5 border-2 z-10 ${
                    session.active
                      ? 'bg-[#d97706] border-[#d97706]'
                      : 'bg-[#141313] border-[#444748]'
                  }`} />

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="label-caps text-[#9ca3af] text-[9px]">{session.label}</span>
                      <span className="text-[10px] text-[#6b7280] font-inter">{session.time}</span>
                    </div>
                    <h3 className="font-playfair text-[14px] font-semibold text-[#e5e2e1] leading-snug mb-1">
                      {session.title}
                    </h3>
                    <p className="text-[12px] text-[#9ca3af] font-inter leading-relaxed line-clamp-3">
                      {session.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
