import { forwardRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const SIZES = {
  sm: 'h-9 px-4 text-xs gap-1.5',
  md: 'h-11 px-6 text-sm gap-2',
  lg: 'h-12 px-8 text-[15px] gap-2',
};

const InteractiveHoverButton = forwardRef(function InteractiveHoverButton(
  { text = 'Button', size = 'md', fullWidth = false, variant = 'primary', arrow = false, className, ...props },
  ref,
) {
  const isPrimary = variant === 'primary';

  return (
    <motion.button
      ref={ref}
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative inline-flex cursor-pointer select-none items-center justify-center overflow-hidden rounded-full font-semibold tracking-tight transition-[box-shadow,border-color,background-color] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
        SIZES[size],
        fullWidth && 'w-full',
        isPrimary
          ? 'border border-accent-primary/80 bg-accent-primary text-surface-0 shadow-[0_4px_14px_rgba(242,184,75,0.35)] hover:border-accent-glow hover:bg-accent-glow hover:shadow-lift'
          : 'border border-border-default bg-surface-0/80 text-text-primary backdrop-blur-md hover:border-accent-primary/35 hover:bg-surface-1 shadow-card',
        className,
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">
        <span>{text}</span>
        {arrow && (
          <ArrowRight
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-300',
              isPrimary ? 'opacity-90 group-hover:translate-x-0.5' : 'text-accent-primary group-hover:translate-x-0.5',
            )}
          />
        )}
      </span>
      {isPrimary && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)',
          }}
        />
      )}
    </motion.button>
  );
});

InteractiveHoverButton.displayName = 'InteractiveHoverButton';

export { InteractiveHoverButton };
export default InteractiveHoverButton;
