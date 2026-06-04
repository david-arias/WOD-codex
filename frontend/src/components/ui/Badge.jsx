import { memo } from 'react'

/**
 * Badge / Chip — etiquetas compactas para estados, eventos y facciones.
 * Design.md: "Small, rectangular tags with 2px rounding."
 * "Use low-opacity versions of faction colors for background."
 *
 * Props:
 *   variant → 'default' | 'blood' | 'amber' | 'arcane' | 'ghost' | 'success' | 'warning'
 *   size    → 'sm' | 'md'
 *   dot     → bool — muestra un punto de color a la izquierda
 *   icon    → ReactNode
 */
const VARIANTS = {
  default: 'bg-white/[0.06] text-[#c4c7c8] border border-white/[0.08]',
  blood:   'bg-[#8b1a1a]/30 text-[#f87171] border border-[#c62828]/30',
  amber:   'bg-[#92400e]/30 text-[#fbbf24] border border-[#d97706]/30',
  arcane:  'bg-[#4c1d95]/30 text-[#a78bfa] border border-[#7c3aed]/30',
  ghost:   'bg-transparent text-[#9ca3af] border border-white/10',
  success: 'bg-[#14532d]/30 text-[#86efac] border border-[#16a34a]/30',
  warning: 'bg-[#78350f]/30 text-[#fde68a] border border-[#d97706]/30',
  active:  'bg-[#1a3a1a]/40 text-[#4ade80] border border-[#22c55e]/25',
}

const DOT_COLORS = {
  default: 'bg-[#9ca3af]',
  blood:   'bg-[#f87171]',
  amber:   'bg-[#fbbf24]',
  arcane:  'bg-[#a78bfa]',
  ghost:   'bg-[#6b7280]',
  success: 'bg-[#86efac]',
  warning: 'bg-[#fde68a]',
  active:  'bg-[#4ade80]',
}

const Badge = memo(({
  variant = 'default',
  size = 'md',
  dot = false,
  icon = null,
  className = '',
  children,
}) => {
  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-[10px] gap-1 rounded-[2px]'
    : 'px-2 py-1 text-[11px] gap-1.5 rounded-[3px]'

  return (
    <span
      className={[
        'inline-flex items-center font-inter font-semibold tracking-[0.06em] uppercase leading-none',
        sizeClasses,
        VARIANTS[variant] || VARIANTS.default,
        className,
      ].filter(Boolean).join(' ')}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[variant] || DOT_COLORS.default}`} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
})

Badge.displayName = 'Badge'
export default Badge
