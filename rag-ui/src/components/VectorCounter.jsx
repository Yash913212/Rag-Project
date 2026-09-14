import { motion, useSpring, useTransform } from 'framer-motion';
import { Database } from 'lucide-react';
import { useEffect } from 'react';

export default function VectorCounter({ count }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const displayCount = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(count);
  }, [count, spring]);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-primary/20 to-accent-primary/5 border border-accent-primary/15 flex items-center justify-center">
          <Database className="w-3.5 h-3.5 text-accent-primary" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <motion.span className="text-lg font-semibold text-text-primary font-mono tabular-nums">
            {displayCount}
          </motion.span>
          <span className="text-[10px] text-text-muted font-mono uppercase tracking-label">vectors</span>
        </div>
      </div>
    </div>
  );
}
