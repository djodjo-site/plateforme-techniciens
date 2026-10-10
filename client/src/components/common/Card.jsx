// client/src/components/common/Card.jsx
export default function Card({
  children,
  padding = 'md',
  hover = false,
  shadow = 'md',
  className = '',
  onClick = null,
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const classes = [
    'bg-white rounded-xl',
    paddings[padding] || paddings.md,
    shadows[shadow] || shadows.md,
    hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : '',
    onClick ? 'cursor-pointer' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} onClick={onClick} {...props}>
      {children}
    </div>
  );
}