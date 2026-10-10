// client/src/components/common/Input.jsx
import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  icon: Icon = null,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-neutral-400" />
          </div>
        )}

        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-2.5
            ${Icon ? 'pl-10' : ''}
            border rounded-lg
            text-neutral-900 placeholder-neutral-400
            transition-colors duration-200
            focus:outline-none focus:ring-2
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            ${error
              ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-100'
              : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-100'
            }
          `}
          {...props}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-sm text-danger-600">{error}</p>
      )}

      {hint && !error && (
        <p className="mt-1.5 text-sm text-neutral-500">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;