import { memo } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

/* ── SVG Icons inline ─────────────────────────────────────── */
const IconDashboard = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="10" y="1" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="1" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="10" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
)

const IconGrimorio = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M3 3C3 2.44772 3.44772 2 4 2H10C10.5523 2 11 2.44772 11 3V14C11 14 9.5 13.5 8 13.5C6.5 13.5 3 14 3 14V3Z"
      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M11 3H14C14.5523 3 15 3.44772 15 4V14L11 14V3Z"
      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    <path d="M3 14C3 14 5 15.5 7 15.5C9 15.5 11 14 11 14"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="5" y1="6" x2="9" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="5" y1="8.5" x2="9" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const IconForja = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="15" y1="3" x2="3" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="9" cy="9" r="2.5" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
)

const IconNarrador = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <ellipse cx="9" cy="9" rx="7" ry="4.5" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="9" cy="9" r="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="9" cy="9" r="0.8" fill="currentColor"/>
  </svg>
)

const IconBitacora = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <line x1="5" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="5" y1="9" x2="11" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="5" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 3H3C2.44772 3 2 3.44772 2 4V12C2 12.5523 2.44772 13 3 13H6"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M10 5L13 8L10 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="13" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const IconLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="6" fill="#201f1f"/>
    <rect x="1" y="1" width="30" height="30" rx="5.5" stroke="white" strokeOpacity="0.1"/>
    <path d="M8 10C8 8.89543 8.89543 8 10 8H16L22 14V22C22 23.1046 21.1046 24 20 24H10C8.89543 24 8 23.1046 8 22V10Z"
      fill="#8b1a1a" fillOpacity="0.6"/>
    <path d="M16 8L22 14H18C16.8954 14 16 13.1046 16 12V8Z"
      fill="#8b1a1a" fillOpacity="0.3"/>
    <line x1="11" y1="17" x2="19" y2="17" stroke="#e5e2e1" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="11" y1="19.5" x2="17" y2="19.5" stroke="#e5e2e1" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="11" y1="14.5" x2="15" y2="14.5" stroke="#e5e2e1" strokeOpacity="0.5" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

/* ── Configuración de navegación ─────────────────────────── */
const NAV_ITEMS = [
  { to: '/',           label: 'Dashboard',          Icon: IconDashboard },
  { to: '/grimorio',   label: 'Grimorio',            Icon: IconGrimorio  },
  { to: '/forja',      label: 'Forja',               Icon: IconForja     },
  { to: '/narrador',   label: 'Pantalla del Narrador', Icon: IconNarrador },
  { to: '/bitacora',   label: 'Bitácora',            Icon: IconBitacora  },
]

/* ── NavItem ─────────────────────────────────────────────── */
const NavItem = memo(({ to, label, Icon }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) => [
      'flex items-center gap-3 px-5 py-2.5 relative',
      'transition-colors duration-150 group select-none',
      isActive
        ? 'text-[#e5e2e1]'
        : 'text-[#6b7280] hover:text-[#c4c7c8]',
    ].join(' ')}
  >
    {({ isActive }) => (
      <>
        {/* Indicador izquierdo — la "sliver of light" del design.md */}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-[#e5e2e1] rounded-r"
            style={{ boxShadow: '0 0 8px rgba(229,226,225,0.6)' }}
          />
        )}
        <Icon />
        <span className="text-[13px] font-inter font-medium leading-none tracking-[0.01em]">
          {label}
        </span>
      </>
    )}
  </NavLink>
))
NavItem.displayName = 'NavItem'

/* ── Sidebar ─────────────────────────────────────────────── */
const Sidebar = memo(({ chronicleTitle = null, chronicleSystem = 'Mundo de Tinieblas' }) => {
  const navigate = useNavigate()

  return (
    <aside
      className="flex flex-col shrink-0 h-full"
      style={{
        width: '220px',
        background: '#0e0e0e',
        borderRight: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 shrink-0">
        <IconLogo />
        <div className="min-w-0">
          <p className="text-[14px] font-inter font-semibold text-[#e5e2e1] leading-tight truncate">
            El Códice
          </p>
          <p className="text-[11px] font-inter text-[#6b7280] leading-tight mt-0.5 truncate">
            {chronicleTitle || chronicleSystem}
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Footer — New Entry + Log Out */}
      <div className="shrink-0 p-4 space-y-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <button
          onClick={() => navigate('/bitacora')}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded
                     border border-white/10 text-[#9ca3af]
                     hover:border-white/20 hover:text-[#e5e2e1]
                     transition-all duration-150 label-caps"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <line x1="6" y1="1" x2="6" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          New Entry
        </button>

        <button
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded
                     text-[#6b7280] hover:text-[#9ca3af]
                     transition-colors duration-150 text-[12px] font-inter"
        >
          <IconLogout />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  )
})

Sidebar.displayName = 'Sidebar'
export default Sidebar
