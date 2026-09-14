import { motion } from 'framer-motion';

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0 whitespace-nowrap';

const sizes = {
  sm: 'h-8 min-w-8 text-xs px-3',
  md: 'h-9 min-w-9 text-sm px-3.5',
  lg: 'h-11 min-w-11 text-sm px-5',
};

const variants = {
  primary:
    'bg-accent-primary text-surface-0 border border-accent-primary/90 shadow-[0_2px_12px_rgba(242,184,75,0.28)] hover:bg-accent-glow hover:border-accent-glow hover:shadow-lift',
  secondary:
    'bg-surface-0/90 text-text-primary border border-border-default backdrop-blur-sm shadow-card hover:bg-surface-1 hover:border-border-hover',
  outline:
    'bg-transparent text-text-secondary border border-border-default hover:text-text-primary hover:border-accent-primary/40 hover:bg-surface-1/80',
  ghost:
    'bg-transparent text-text-muted hover:text-text-primary hover:bg-surface-2/80',
  danger:
    'bg-transparent text-text-muted border border-transparent hover:text-status-error hover:bg-status-error/10 hover:border-status-error/20',
};

export default function Button({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = '',
  title,
  whileTap = { scale: 0.97 },
  whileHover,
  ...rest
}) {
  const classes = [baseClasses, sizes[size], variants[variant], className].join(' ');
  return (
    <motion.button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      title={title}
      whileTap={disabled ? undefined : whileTap}
      whileHover={disabled ? undefined : whileHover}
      {...rest}
    >
      {children}
    </motion.button>
  );
}