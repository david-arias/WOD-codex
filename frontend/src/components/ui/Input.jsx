import { memo, forwardRef } from 'react'

/**
 * Input — campo de texto oscuro y minimalista.
 * Focus: outline off-white sutil (design.md: "glow slightly with neutral off-white").
 *
 * Props:
 *   label       → string
 *   error       → string — mensaje de error
 *   hint        → string — texto de ayuda
 *   labelStyle  → 'caps' | 'normal'
 */
const Input = memo(forwardRef(({
  label,
  error,
  hint,
  labelStyle = 'caps',
  className = '',
  ...props
}, ref) => {
  const labelClasses = labelStyle === 'caps'
    ? 'label-caps text-[#9ca3af] mb-1.5 block'
    : 'text-sm font-medium text-[#c4c7c8] mb-1.5 block'

  return (
    <div className="w-full">
      {label && (
        <label className={labelClasses}>{label}</label>
      )}
      <input
        ref={ref}
        className={[
          'w-full bg-[#201f1f] border rounded px-3 py-2',
          'text-[14px] text-[#e5e2e1] font-inter',
          'placeholder:text-[#6b7280]',
          'outline-none transition-all duration-150',
          error
            ? 'border-[#c62828]/60 focus:border-[#f87171]/60'
            : 'border-[#444748] focus:border-[rgba(229,226,225,0.35)] focus:shadow-[0_0_0_1px_rgba(229,226,225,0.08)]',
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[11px] text-[#f87171] font-inter">{error}</p>
      )}
      {hint && !error && (
        <p className="mt-1 text-[11px] text-[#6b7280] font-inter">{hint}</p>
      )}
    </div>
  )
}))

Input.displayName = 'Input'
export default Input
