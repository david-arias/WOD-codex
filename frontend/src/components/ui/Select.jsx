import { memo, forwardRef } from 'react'

/**
 * Select — dropdown oscuro alineado con el design system.
 */
const Select = memo(forwardRef(({
  label,
  error,
  options = [],
  placeholder,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="label-caps text-[#9ca3af] mb-1.5 block">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={[
            'w-full appearance-none bg-[#201f1f] border rounded px-3 py-2 pr-8',
            'text-[14px] text-[#e5e2e1] font-inter',
            'outline-none transition-all duration-150 cursor-pointer',
            error
              ? 'border-[#c62828]/60'
              : 'border-[#444748] focus:border-[rgba(229,226,225,0.35)]',
            className,
          ].filter(Boolean).join(' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map(opt => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#201f1f] text-[#e5e2e1]"
            >
              {opt.label}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="#9ca3af" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {error && (
        <p className="mt-1 text-[11px] text-[#f87171] font-inter">{error}</p>
      )}
    </div>
  )
}))

Select.displayName = 'Select'
export default Select
