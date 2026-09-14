import { motion } from 'framer-motion';
import { Sparkles, Sun, Moon, Loader2 } from 'lucide-react';
import Button from './ui/Button';
import { useTheme } from '../context/theme';
import { useHealth } from '../hooks/useHealth';

export default function ChatHeader({ onClear, messageCount, isProcessing }) {
  const { theme, toggleTheme } = useTheme();
  const { model } = useHealth();
  const modelLabel = model ? model.replace(':latest', '') : 'Llama 3.2';

  return (
    <div className="app-shell-header flex items-center justify-between py-3 border-b border-border-default bg-surface-0/85 backdrop-blur-xl z-20 relative shadow-[0_1px_0_rgba(0,0,0,0.04)]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-hover/60 to-transparent" />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-accent-primary animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-accent-primary" />
          )}
          <h2 className="text-sm font-display font-semibold text-text-primary tracking-wide">
            Intelligence
          </h2>
        </div>
        <div className="h-4 w-px bg-border-default" />
        <span className="text-[10px] font-mono text-text-dim uppercase tracking-label truncate max-w-[40vw] sm:max-w-none">{modelLabel}</span>
      </div>

      <div className="flex items-center gap-2">
        {messageCount > 0 && !isProcessing && (
          <motion.span
            key={`count-${messageCount}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-[10px] text-text-muted font-mono tabular-nums tracking-label"
          >
            {messageCount} {messageCount === 1 ? 'message' : 'messages'}
          </motion.span>
        )}
        {isProcessing && (
          <span className="text-[10px] text-accent-primary font-mono uppercase tracking-label animate-pulse">
            synthesizing…
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>
        {messageCount > 0 && (
          <Button variant="danger" size="sm" onClick={onClear} title="Clear chat">
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}