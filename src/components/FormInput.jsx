import { memo } from 'react'

const FormInput = memo(function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  min,
  max,
  step,
  error,
  helperText,
  className = ''
}) {
  const baseInputClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
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
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={`${baseInputClasses} ${errorClasses} ${disabledClasses}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
})

export default FormInput
