import { memo } from 'react'

/**
 * DotRating — sistema de puntos circular para fichas de personaje.
 * Replica los dots de atributos, habilidades, disciplinas, esferas, etc.
 *
 * Props:
 *   value   → int — puntos rellenos
 *   max     → int — total de círculos (default 5)
 *   color   → 'white' | 'blood' | 'amber' | 'arcane' | 'muted'
 *   size    → 'sm' | 'md' | 'lg'
 *   onClick → (newValue) => void — hace los dots interactivos
 */
const DOT_FILLED = {
  white:  'bg-[#e5e2e1] border-[#e5e2e1]',
  blood:  'bg-[#f87171] border-[#f87171]',
  amber:  'bg-[#fbbf24] border-[#fbbf24]',
  arcane: 'bg-[#a78bfa] border-[#a78bfa]',
  muted:  'bg-[#9ca3af] border-[#9ca3af]',
}

const DOT_EMPTY = {
  white:  'bg-transparent border-[#444748]',
  blood:  'bg-transparent border-[#c62828]/40',
  amber:  'bg-transparent border-[#d97706]/40',
  arcane: 'bg-transparent border-[#7c3aed]/40',
  muted:  'bg-transparent border-[#353434]',
}

const DOT_SIZES = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
}

const DotRating = memo(({
  value = 0,
  max = 5,
  color = 'white',
  size = 'sm',
  onClick,
  className = '',
}) => {
  const dotSize = DOT_SIZES[size] || DOT_SIZES.sm

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: max }, (_, i) => {
        const isFilled = i < value
        const filledClass = DOT_FILLED[color] || DOT_FILLED.white
        const emptyClass  = DOT_EMPTY[color]  || DOT_EMPTY.white

        return (
          <button
            key={i}
            type="button"
            onClick={onClick ? () => onClick(i + 1 === value ? 0 : i + 1) : undefined}
            className={[
              dotSize,
              'rounded-full border shrink-0',
              'transition-all duration-100',
              isFilled ? filledClass : emptyClass,
              onClick ? 'cursor-pointer hover:scale-110' : 'cursor-default pointer-events-none',
            ].filter(Boolean).join(' ')}
            aria-label={`${i + 1} de ${max}`}
          />
        )
      })}
    </div>
  )
})

DotRating.displayName = 'DotRating'
export default DotRating
