import { memo } from 'react'

/**
 * Button — estilo ghost/outline del design.md.
 * Tipografía label-caps: Inter, 11px, tracking-widest, uppercase, semibold.
 *
 * Props:
 *   variant  → 'ghost' | 'blood' | 'amber' | 'arcane' | 'filled'
 *   size     → 'sm' | 'md' | 'lg'
 *   icon     → ReactNode — icono a mostrar a la izquierda
 *   disabled → bool
 */
const VARIANTS = {
  ghost: [
    'border border-white/20 text-[#e5e2e1]',
    'hover:border-white/35 hover:bg-white/[0.04]',
  ],
  blood: [
    'border border-[#c62828] text-[#f87171]',
    'hover:bg-[#c62828]/10 hover:border-[#f87171]',
  ],
  amber: [
    'border border-[#d97706] text-[#fbbf24]',
    'hover:bg-[#d97706]/10 hover:border-[#fbbf24]',
  ],
  arcane: [
    'border border-[#7c3aed] text-[#a78bfa]',
    'hover:bg-[#7c3aed]/10 hover:border-[#a78bfa]',
  ],
  filled: [
    'bg-white/10 border border-white/20 text-[#e5e2e1]',
    'hover:bg-white/15',
  ],
}

const SIZES = {
  sm: 'px-3 py-1.5 text-[10px] gap-1.5',
  md: 'px-4 py-2 text-[11px] gap-2',
  lg: 'px-5 py-2.5 text-[12px] gap-2',
}

const Button = memo(({
  variant = 'ghost',
  size = 'md',
  icon = null,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  children,
}) => {
  const variantClasses = VARIANTS[variant] || VARIANTS.ghost

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        // Base
        'inline-flex items-center justify-center rounded',
        'font-inter font-semibold tracking-[0.08em] uppercase',
        'transition-all duration-180 cursor-pointer select-none',
        'whitespace-nowrap',
        // Size
        SIZES[size],
        // Variant
        ...variantClasses,
        // Disabled
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
