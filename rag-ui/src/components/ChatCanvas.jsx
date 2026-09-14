import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { motion } from 'framer-motion';
import { Search, FileText, Lightbulb, List } from 'lucide-react';

const SUGGESTIONS = [
  { icon: Search, text: "Summarize this document" },
  { icon: FileText, text: "What are the key points?" },
  { icon: Lightbulb, text: "Explain the main concepts" },
  { icon: List, text: "List all important findings" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export default function ChatCanvas({
  messages,
  isProcessing,
  onSend,
  onRegenerate,
  onStop,
  onClear,
}) {
  const isEmpty = messages.length === 0;

  return (
    <main className="flex-1 flex flex-col min-w-0 h-full bg-transparent relative z-10 overflow-hidden">
      <ChatHeader onClear={onClear} messageCount={messages.length} isProcessing={isProcessing} />

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
          <div className="pointer-events-none absolute w-72 h-72 rounded-full bg-accent-primary/10 blur-3xl animate-subtle-glow" />
          <div className="pointer-events-none absolute w-56 h-56 rounded-full bg-accent-glow/5 blur-2xl animate-subtle-glow" style={{ animationDelay: '2s' }} />
          <div className="w-full max-w-2xl flex flex-col items-center -mt-8 md:-mt-16 relative z-10">
            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-1 border border-border-default text-[10px] font-mono text-text-dim uppercase tracking-label mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                Private · Local · Zero Telemetry
              </div>
              <h1 className="chat-empty-title font-display font-bold text-text-primary mb-4 text-balance">
                What can I find{' '}
                <span className="gradient-text gradient-text-anim">for you?</span>
              </h1>
              <p className="text-base md:text-lg text-text-muted text-pretty max-w-lg leading-relaxed">
                Upload a PDF in the sidebar, then ask anything about its content — answers stay on your machine.
              </p>
            </motion.div>

            {/* Input */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <ChatInput onSend={onSend} onStop={onStop} isProcessing={isProcessing} isLarge={true} />
            </motion.div>

            {/* Quick-start suggestions */}
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-2.5 mt-5 w-full"
            >
              {SUGGESTIONS.map((suggestion) => (
                <motion.button
                  key={suggestion.text}
                  variants={item}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSend(suggestion.text)}
                  className="suggestion-chip min-h-11 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
                >
                  <suggestion.icon className="w-4 h-4 text-text-dim group-hover:text-accent-primary transition-colors shrink-0" />
                  <span>{suggestion.text}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto relative flex flex-col scroll-smooth">
            <div className="max-w-3xl mx-auto w-full h-full flex flex-col px-4 sm:px-6">
              <MessageList
                messages={messages}
                isProcessing={isProcessing}
                onRegenerate={onRegenerate}
              />
            </div>
          </div>

          <div className="w-full bg-gradient-to-t from-surface-0 via-surface-0/95 to-surface-0/60 backdrop-blur-md border-t border-border-subtle z-20 pt-3 pb-4">
            <div className="max-w-3xl mx-auto w-full px-4 sm:px-6">
              <ChatInput onSend={onSend} onStop={onStop} isProcessing={isProcessing} isLarge={false} />
            </div>
          </div>
        </>
      )}
    </main>
  );
}