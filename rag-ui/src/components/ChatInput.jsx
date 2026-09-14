import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { motion } from 'framer-motion';
import Kbd from './ui/Kbd';

export default function ChatInput({ onSend, onStop, isProcessing, isLarge }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    onSend(query);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, isLarge ? 160 : 128)}px`;
  }, [query, isLarge]);

  // Keyboard shortcuts: "/" focuses the composer, "Esc" stops generation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      if (e.key === 'Escape' && isProcessing) {
        e.preventDefault();
        onStop?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isProcessing, onStop]);

  const hasText = query.trim().length > 0;
  const isFocusedClass = isFocused && !isProcessing;

  return (
    <div className="py-2 relative z-10 bg-transparent">
      {isFocusedClass && (
        <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-accent-primary/15 via-accent-glow/10 to-accent-primary/15 opacity-70 blur-xl animate-subtle-glow" />
      )}
      <div
        className={`chat-composer relative flex items-end gap-2 rounded-2xl px-4 border transition-all duration-300 ${
          isLarge ? 'py-4' : 'py-3'
        } ${
          isFocusedClass
            ? 'chat-composer-focused bg-surface-0/95 border-accent-primary/45'
            : 'bg-surface-0/90 border-border-default'
        } backdrop-blur-xl`}
      >
        {/* Shimmer effect on focus */}
        {isFocused && !isProcessing && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-primary/5 to-transparent animate-shimmer-slide" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2 w-full relative z-10">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask a question about your documents..."
            rows={1}
            disabled={isProcessing}
            aria-label="Message"
            className={`flex-1 ${
              isLarge ? 'min-h-[32px] text-base' : 'max-h-32 min-h-[24px] text-sm'
            } bg-transparent border-none resize-none focus:outline-none text-text-primary placeholder:text-text-dim font-sans leading-relaxed`}
          />

          {isProcessing ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onStop}
              title="Stop generating (Esc)"
              aria-label="Stop generating"
              className={`${isLarge ? 'w-9 h-9' : 'w-8 h-8'} shrink-0 rounded-lg bg-status-error/15 text-status-error border border-status-error/25 flex items-center justify-center hover:bg-status-error/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/50`}
            >
              <Square className={`${isLarge ? 'w-3.5 h-3.5' : 'w-3 h-3'} fill-current`} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={hasText ? { scale: 1.1 } : {}}
              whileTap={hasText ? { scale: 0.9 } : {}}
              type="submit"
              disabled={!hasText}
              aria-label="Send message"
              className={`${isLarge ? 'w-9 h-9' : 'w-8 h-8'} shrink-0 rounded-lg flex items-center justify-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 ${
                hasText
                  ? 'bg-accent-primary text-surface-0 shadow-glow hover:bg-accent-glow hover:shadow-lift'
                  : 'bg-surface-3 text-text-dim cursor-not-allowed'
              }`}
            >
              <ArrowUp className={`${isLarge ? 'w-4 h-4' : 'w-3.5 h-3.5'}`} />
            </motion.button>
          )}
        </form>
      </div>

      {isLarge && (
        <div className={`text-center mt-2.5 flex items-center justify-center gap-2 transition-all duration-300 ${
          isFocused ? 'opacity-100' : 'opacity-50'
        }`}>
          <Kbd>/</Kbd>
          <span className="text-[10px] text-text-dim font-mono tracking-label">to focus</span>
          <span className="text-text-dim/40">·</span>
          <Kbd>↵</Kbd>
          <span className="text-[10px] text-text-dim font-mono tracking-label">to send</span>
          <span className="text-text-dim/40">·</span>
          <Kbd>Esc</Kbd>
          <span className="text-[10px] text-text-dim font-mono tracking-label">to stop</span>
        </div>
      )}
    </div>
  );
}