import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIMessage from './AIMessage';
import UserMessage from './UserMessage';
import SynthesizingIndicator from './SynthesizingIndicator';

const toDateLabel = (ts) => {
  const date = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
};

function DayDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-2" aria-hidden="true">
      <div className="flex-1 h-px bg-border-subtle" />
      <span className="text-[9px] font-mono uppercase tracking-label text-text-dim">{label}</span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  );
}

export default function MessageList({ messages, isProcessing, onRegenerate }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isProcessing]);

  const isStreamingVisible = isProcessing && !messages.some((m) => m.role === 'assistant' && m.isStreaming);

  return (
    <div className="flex-1 w-full py-6">
      <div className="flex flex-col gap-6 w-full">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const prev = messages[index - 1];
            const showDivider = !prev || toDateLabel(prev.timestamp) !== toDateLabel(msg.timestamp);
            const isLast = index === messages.length - 1;

            return (
              <div key={msg.id}>
                {showDivider && <DayDivider label={toDateLabel(msg.timestamp)} />}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                    delay: index === messages.length - 1 ? 0.05 : 0,
                  }}
                >
                  {msg.role === 'user' ? (
                    <UserMessage content={msg.content} timestamp={msg.timestamp} />
                  ) : (
                    <AIMessage
                      content={msg.content}
                      sources={msg.sources}
                      timestamp={msg.timestamp}
                      isStreaming={msg.isStreaming}
                      isLast={isLast && !isProcessing}
                      onRegenerate={onRegenerate}
                    />
                  )}
                </motion.div>
              </div>
            );
          })}
          {isStreamingVisible && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <SynthesizingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
}