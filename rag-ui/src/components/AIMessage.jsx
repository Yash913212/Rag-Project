import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ContextInspector from './ContextInspector';
import Button from './ui/Button';
import { motion } from 'framer-motion';
import { AlertCircle, Bot, Check, Copy, RefreshCw } from 'lucide-react';

const escapeHtml = (str) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

function CopyButton({ getText }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy message" aria-label="Copy message">
      {copied ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
    </Button>
  );
}

const markdownComponents = {
  a: ({ node: _node, ...props }) => <a target="_blank" rel="noreferrer noopener" {...props} />,
  pre: ({ children }) => (
    <div className="relative group/pre">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover/pre:opacity-100 transition-opacity"
        title="Copy code"
        aria-label="Copy code"
        onClick={async () => {
          const text = children?.props?.children?.props?.children;
          try {
            if (typeof text === 'string') await navigator.clipboard.writeText(text);
          } catch { /* clipboard unavailable */ }
        }}
      >
        <Copy className="w-3 h-3" />
      </Button>
      {children}
    </div>
  ),
};

function ErrorParagraph({ paragraph, isFirst }) {
  const html = escapeHtml(paragraph).replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="font-semibold text-status-error">$1</strong>'
  );
  return (
    <p className="mb-2 last:mb-0 font-sans">
      {isFirst && <AlertCircle className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />}
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </p>
  );
}

export default function AIMessage({ content, sources, timestamp, isStreaming, isLast, onRegenerate }) {
  const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isError = content.includes('**Error:**') || content.includes('**Connection Error:**');

  return (
    <div className="flex gap-3 w-full group">
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
          className="w-7 h-7 rounded-xl bg-gradient-to-br from-accent-primary/25 to-accent-primary/5 border border-accent-primary/25 flex items-center justify-center shadow-glow"
        >
          <Bot className="w-3.5 h-3.5 text-accent-primary" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-text-dim font-mono tracking-label opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-1.5">
            {timeString}
          </span>
        </div>

        <motion.div
          className={`${isError ? 'bg-status-error/5 border border-status-error/20 rounded-xl p-4' : ''}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.15 }}
        >
          {isError ? (
            <div className="text-[14px] leading-7 text-status-error">
              {content.split('\n').filter((p) => p.trim()).map((p, i) => (
                <ErrorParagraph key={i} paragraph={p} isFirst={i === 0} />
              ))}
            </div>
          ) : (
            <div className="text-[14px] leading-7 text-text-secondary">
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              </div>
              {isStreaming && <span className="inline-block w-1.5 h-4 bg-accent-primary ml-0.5 align-text-bottom animate-type-cursor" />}
            </div>
          )}

          {sources && sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border-default">
              <ContextInspector sources={sources} />
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
          <CopyButton getText={() => content} />
          {isLast && !isStreaming && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              title="Regenerate response"
              aria-label="Regenerate response"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}