import { forwardRef } from 'react'

/**
 * FormField - Composant de champ de formulaire réutilisable
 *
 * @param {Object} props
 * @param {String} props.label - Label du champ
 * @param {String} props.type - Type d'input (text, number, email, tel, date, select, textarea)
 * @param {String} props.name - Nom du champ
 * @param {String|Number} props.value - Valeur du champ
 * @param {Function} props.onChange - Callback de changement
 * @param {String} props.error - Message d'erreur
 * @param {Boolean} props.required - Champ requis
 * @param {String} props.placeholder - Placeholder
 * @param {Boolean} props.disabled - Champ désactivé
 * @param {Array} props.options - Options pour select (format: [{value, label}])
 * @param {String} props.helperText - Texte d'aide sous le champ
 * @param {Object} props.inputProps - Props additionnelles pour l'input
 */
const FormField = forwardRef(({
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  disabled = false,
  options = [],
  helperText = '',
  inputProps = {},
  ...rest
}, ref) => {
  const baseInputClasses = `w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
    error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            ref={ref}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={baseInputClasses}
            {...inputProps}
            {...rest}
          >
            <option value="">{placeholder || 'Sélectionner...'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <textarea
            ref={ref}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={4}
            className={baseInputClasses}
            {...inputProps}
            {...rest}
          />
        )

      default:
        return (
          <input
            ref={ref}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClasses}
            {...inputProps}
            {...rest}
          />
        )
    }
  }

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {renderInput()}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
})

FormField.displayName = 'FormField'

export default FormField
