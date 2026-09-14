import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Loader } from 'lucide-react';
import { useToast } from './ui/toastContext';

export default function DropZone({ onUpload, isUploading, progress }) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const acceptFile = (file) => {
    const isPdfOrMd = file?.type === 'application/pdf' || /\.(pdf|md)$/i.test(file?.name || '');
    if (!isPdfOrMd) {
      toast('Only PDF and Markdown files are supported.', 'error');
      return;
    }
    onUpload(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      acceptFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      acceptFile(e.target.files[0]);
    }
  };

  return (
    <motion.div
      whileHover={!isUploading ? { scale: 1.01 } : {}}
      whileTap={!isUploading ? { scale: 0.99 } : {}}
      className={`relative w-full rounded-xl border border-dashed transition-all duration-300 overflow-hidden cursor-pointer
        ${
          isDragActive
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-border-default bg-surface-0/50 hover:border-border-hover hover:bg-surface-2/30 hover:shadow-card'
        }`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={!isUploading ? handleClick : undefined}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="application/pdf,.md"
        className="hidden"
        disabled={isUploading}
      />
      
      <div className="px-3.5 py-4 flex flex-col items-center justify-center gap-2 text-center">
        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-2.5 w-full"
            >
              <Loader className="w-5 h-5 text-accent-primary animate-spin" />
              <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-accent-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-text-muted font-mono tracking-label uppercase">
                {progress < 30 ? 'Uploading' : progress < 60 ? 'Chunking' : progress < 95 ? 'Embedding' : 'Finalizing'} · {progress}%
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <UploadCloud className={`w-5 h-5 transition-colors ${isDragActive ? 'text-accent-primary' : 'text-text-muted'}`} />
              <div>
                <p className="text-xs font-medium text-text-secondary">Upload Document (PDF, MD)</p>
                <p className="text-[10px] text-text-dim mt-1 font-mono tracking-label">Drop or click to browse</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
