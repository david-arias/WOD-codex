import { memo } from 'react'

/**
 * Card — contenedor base del design system Gothic-Punk Modern.
 *
 * Props:
 *   faction      → 'blood' | 'amber' | 'arcane' | null
 *                  Aplica la línea de color superior de 2px (design.md).
 *   hover        → bool — activa hover border más brillante
 *   className    → clases adicionales
 *   onClick      → handler (añade cursor-pointer)
 */
const FACTION_BORDERS = {
  blood:  'border-t-[2px] border-t-[#c62828]',
  amber:  'border-t-[2px] border-t-[#d97706]',
  arcane: 'border-t-[2px] border-t-[#7c3aed]',
}

const Card = memo(({
  faction = null,
  hover = true,
  className = '',
  onClick,
  children,
}) => {
  const factionBorder = faction ? FACTION_BORDERS[faction] : ''
  const clickable = onClick ? 'cursor-pointer' : ''

  return (
    <div
      onClick={onClick}
      className={[
        'bg-[#1c1b1b] rounded border border-white/[0.06]',
        hover ? 'transition-colors duration-200 hover:border-white/[0.12]' : '',
        factionBorder,
        clickable,
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'
export default Card
