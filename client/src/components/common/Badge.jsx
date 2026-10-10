// client/src/components/common/Badge.jsx

const COLORS = {
  primary: 'bg-primary-100 text-primary-700',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-accent-100 text-accent-700',
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: 'bg-neutral-100 text-neutral-700'
};

const SIZES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm'
};

export default function Badge({
  children,
  color = 'primary',
  size = 'md',
  icon: Icon = null,
  rounded = 'full',
  className = ''
}) {
  const classes = [
    'inline-flex items-center gap-1 font-semibold',
    rounded === 'full' ? 'rounded-full' : 'rounded-md',
    COLORS[color] || COLORS.primary,
    SIZES[size] || SIZES.md,
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}