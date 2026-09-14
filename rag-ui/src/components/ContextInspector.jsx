import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText, Gauge } from 'lucide-react';

function Confidence({ value }) {
  const pct = Math.round((value ?? 0.5) * 100);
  const tone =
    pct >= 70 ? 'text-status-success' : pct >= 40 ? 'text-amber-400' : 'text-status-error';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono ${tone}`}>
      <Gauge className="w-2.5 h-2.5" />
      {pct}%
    </span>
  );
}

export default function ContextInspector({ sources }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors focus-visible:outline-none group"
        aria-expanded={isOpen}
      >
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
        <span className="font-mono text-[10px] uppercase tracking-label">{sources.length} sources</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="overflow-hidden mt-3 space-y-2 origin-top"
          >
            {sources.map((source, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 rounded-lg bg-surface-1 border border-border-default group hover:border-border-hover transition-colors"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
                    <FileText className="w-3 h-3 text-accent-primary shrink-0" />
                    <span className="truncate">{source.page || 'Unknown page'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Confidence value={source.score} />
                  </div>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed font-mono line-clamp-3">
                  {source.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}