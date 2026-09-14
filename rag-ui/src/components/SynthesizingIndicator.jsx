import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import Skeleton from './ui/Skeleton';

export default function SynthesizingIndicator() {
  return (
    <div className="flex gap-3 w-full">
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-7 h-7 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shadow-glow"
        >
          <Bot className="w-3.5 h-3.5 text-accent-primary" />
        </motion.div>
      </div>

      {/* Typing skeleton bubble */}
      <div className="flex-1 min-w-0 max-w-[70%]">
        <div className="rounded-2xl rounded-tl-md border border-border-default bg-surface-1 p-4 shadow-card">
          <div className="flex flex-col gap-2.5">
            <Skeleton className="w-3/4 h-3" />
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-2/3 h-3" />
          </div>
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border-default">
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent-primary/70"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent-primary/70"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
            />
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-accent-primary/70"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />
            <span className="ml-1.5 text-[10px] text-text-dim font-mono uppercase tracking-label">Synthesizing</span>
          </div>
        </div>
      </div>
    </div>
  );
}