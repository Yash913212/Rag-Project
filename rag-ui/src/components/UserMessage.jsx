import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy } from 'lucide-react';

export default function UserMessage({ content, timestamp }) {
  const [copied, setCopied] = useState(false);
  const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="flex flex-col items-end w-full group">
      <div className="flex items-center gap-2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="text-[10px] text-text-dim font-mono tracking-label">{timeString}</span>
      </div>

      <motion.div
        className="relative w-fit max-w-[85%] rounded-2xl rounded-br-md px-4 py-3 bg-gradient-to-br from-accent-primary to-accent-glow text-surface-0 shadow-glow"
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        <div className="flex justify-end mt-1.5 -mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            title="Copy message"
            aria-label="Copy message"
            className="p-1 rounded-md text-surface-0/70 hover:text-surface-0 hover:bg-surface-0/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-0/60"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}