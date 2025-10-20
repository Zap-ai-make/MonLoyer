import { memo } from 'react'

const FormSelect = memo(function FormSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Sélectionner...',
  required = false,
  disabled = false,
  error,
  helperText,
  className = ''
}) {
  const baseSelectClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
  const errorClasses = error
    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
    : "border-gray-300 focus:ring-green-500 focus:border-green-500"
  const disabledClasses = disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"

  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`${baseSelectClasses} ${errorClasses} ${disabledClasses}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

export default FormSelect
