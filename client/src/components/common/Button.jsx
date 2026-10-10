// client/src/components/common/Button.jsx
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-white text-primary-700 border-2 border-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500',
  danger: 'bg-danger-600 text-white hover:bg-danger-700 focus:ring-danger-500',
  warning: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-500',
  ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
  outline: 'bg-transparent border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-400',
  dark: 'bg-neutral-800 text-white hover:bg-neutral-900 focus:ring-neutral-700'
};

const SIZES = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon = null,
  iconPosition = 'left',
  className = '',
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-lg',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? 'w-full' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Chargement...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  );
}