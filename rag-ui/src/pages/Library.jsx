import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Trash2, UploadCloud, FileJson } from 'lucide-react';
import { API_BASE } from '../config';

function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`;
}

function FileCard({ file, onDelete }) {
  const isPDF = file.type === '.pdf';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ 
        opacity: 0, 
        scale: 0.8, 
        rotate: -5,
        y: 20,
        transition: { duration: 0.3 } 
      }}
      className="relative group p-6 rounded-lg border border-fog/20 bg-indigo/30 hover:bg-indigo/50 transition-colors flex flex-col justify-between h-48 overflow-hidden"
    >
      {isPDF && (
        <div className="absolute top-0 right-0 w-8 h-8 bg-fog/10 transition-transform origin-top-right group-hover:scale-125 group-hover:-rotate-12 rounded-bl-xl" />
      )}
      {!isPDF && (
        <div className="absolute top-8 left-0 w-full h-px bg-gradient-to-r from-transparent via-brass/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      )}

      <div>
        <div className="mb-4">
          {isPDF ? <FileText className="text-brass" /> : <FileJson className="text-moss" />}
        </div>
        <h3 className="font-ui-label text-parchment line-clamp-2" title={file.name}>{file.name}</h3>
      </div>
      
      <div className="flex justify-between items-end mt-4">
        <span className="font-data-mono text-fog text-[10px]">
          {formatBytes(file.size)} &middot; {file.chunks} chunk{file.chunks !== 1 && 's'}
        </span>
        <button 
          onClick={() => onDelete(file.name)}
          className="text-fog hover:text-rust opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

export function Library() {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const fileInputRef = useRef(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data);
      }
    } catch (e) {
      console.error("Failed to fetch documents", e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFiles(files.filter(f => f.name !== name));
      }
    } catch (e) {
      console.error("Failed to delete document", e);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);

    setUploadProgress({ percent: 0, phase: 'uploading' });

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const textChunk = decoder.decode(value, { stream: true });
          const lines = textChunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.substring(6));
              if (data.type === 'progress') {
                setUploadProgress({ percent: data.percent, phase: data.phase });
              } else if (data.type === 'done') {
                setUploadProgress(null);
                fetchDocuments();
              } else if (data.type === 'error') {
                console.error("Upload error:", data.message);
                setUploadProgress(null);
                alert(data.message);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setUploadProgress(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="h-full p-8 overflow-y-auto">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="font-hero text-4xl text-brass mb-2">Library</h1>
          <p className="font-body text-fog">Manage your local document corpus.</p>
        </div>
        <div className="font-data-mono text-fog">
          {files.length} FILE{files.length !== 1 ? 'S' : ''}
        </div>
      </header>

      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploadProgress && fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-xl mb-12 transition-colors flex items-center justify-center cursor-pointer hover:bg-indigo/30
          ${isDragging ? 'border-brass bg-brass/5' : 'border-fog/20'} 
          ${uploadProgress ? 'h-24 cursor-default' : 'h-32'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          accept=".pdf,.md" 
          className="hidden" 
        />
        
        {uploadProgress ? (
          <div className="flex items-center gap-4 text-brass font-data-mono">
            <UploadCloud className="animate-bounce" />
            <span>
              {uploadProgress.phase === 'uploading' ? 'Uploading...' : 'Embedding...'} {Math.round(uploadProgress.percent)}%
            </span>
          </div>
        ) : (
          <div className="text-fog font-ui-label flex flex-col items-center gap-2 pointer-events-none">
            <UploadCloud size={24} className="mb-1" />
            <span className="text-parchment font-body">Click to upload or drag & drop</span>
            <span className="text-xs">PDF or Markdown files</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <AnimatePresence>
          {files.map(file => (
            <FileCard key={file.name} file={file} onDelete={handleDelete} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
