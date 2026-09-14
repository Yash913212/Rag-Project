import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function FileList({ files }) {
  if (files.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4">
      <h3 className="text-[10px] font-mono uppercase tracking-label text-text-muted mb-3 px-1">Documents</h3>
      <div className="space-y-1.5">
        <AnimatePresence>
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface-0/50 border border-border-default group hover:border-accent-primary/30 hover:bg-surface-2/40 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-secondary truncate">{file.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-text-muted font-mono tracking-label">
                  <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span className="opacity-30">·</span>
                  <span>{file.chunks} chunks</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
