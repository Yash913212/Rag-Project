import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Compass, MessageSquarePlus, Paperclip, UploadCloud, FileText, X } from 'lucide-react';
import { useUI } from '../context/UIContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { API_BASE } from '../config';

function CitationChip({ id, sourceData, onClick }) {
  return (
    <motion.button
      layoutId={`citation-${id}-${sourceData?.id || id}`}
      onClick={() => onClick(sourceData)}
      className="inline-flex items-center justify-center h-5 px-2 ml-1 text-[10px] font-data-mono bg-brass text-ink rounded hover:bg-parchment transition-colors align-middle"
    >
      [{id}]
    </motion.button>
  );
}

function CompassSpinner({ isSpinning }) {
  return (
    <motion.div
      animate={{ rotate: isSpinning ? 360 : 0 }}
      transition={{ 
        repeat: isSpinning ? Infinity : 0, 
        duration: 2, 
        ease: "linear" 
      }}
      className="text-fog"
    >
      <Compass size={20} />
    </motion.div>
  );
}

export function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const { openInspector } = useUI();
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = () => {
    setMessages([]);
    setSuggestions([]);
    setInput('');
    setActiveDocument(null);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const fetchLatestDoc = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents`);
        if (res.ok) {
          const docs = await res.json();
          if (docs.length > 0) {
            docs.sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
            setActiveDocument(docs[0].name);
          }
        }
      } catch (e) {
        console.error("Failed to load documents", e);
      }
    };
    if (messages.length === 0 && !activeDocument) {
      fetchLatestDoc();
    }
  }, [messages.length, activeDocument]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    setUploadProgress({ phase: 'uploading', percent: 0 });

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

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
              try {
                const data = JSON.parse(line.substring(6));
                if (data.type === 'progress') {
                  setUploadProgress({ phase: data.phase, percent: data.percent });
                } else if (data.type === 'done') {
                  setActiveDocument(file.name);
                  setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `You have uploaded **${file.name}** and I am using this document. What would you like to know?`,
                    sources: []
                  }]);
                  setSuggestions([
                    "Summarize this document",
                    "What are the key takeaways?",
                    "What is the main topic?"
                  ]);
                  setUploadProgress(null);
                } else if (data.type === 'error') {
                  alert(data.message);
                  setUploadProgress(null);
                }
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload file');
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e, forcedInput = null) => {
    if (e) e.preventDefault();
    const query = forcedInput || input;
    if (!query.trim()) return;

    const newMsg = { role: 'user', content: query };
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    
    setMessages((prev) => [...prev, newMsg, { role: 'assistant', content: '', isStreaming: true, sources: [] }]);
    setInput('');
    setIsLoading(true);
    setSuggestions([]);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, history, document: activeDocument })
      });

      if (!response.ok) throw new Error("Chat request failed");

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
              try {
                const data = JSON.parse(line.substring(6));
                
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = { ...copy[copy.length - 1] };
                  
                  if (data.type === 'sources') {
                    last.sources = data.sources;
                  } else if (data.type === 'content') {
                    last.content += data.token;
                  } else if (data.type === 'end') {
                    last.isStreaming = false;
                    setSuggestions(data.suggestions || []);
                  }
                  
                  copy[copy.length - 1] = last;
                  return copy;
                });
              } catch(e) {
                console.error("Parse error", e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        last.content += "\n\n*(Error: Unable to connect to the backend)*";
        last.isStreaming = false;
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCitationClick = (source) => {
    if (!source) return;
    openInspector(`**${source.page}**\n\n> ${source.text}`);
  };

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto py-8 px-4 relative">
      {messages.length > 0 && (
        <button 
          onClick={handleNewChat}
          className="absolute top-2 right-4 md:-right-8 px-3 py-1.5 bg-indigo/50 backdrop-blur-sm text-brass border border-brass/20 rounded-lg font-ui-label hover:bg-brass hover:text-ink transition-colors flex items-center gap-2 text-xs uppercase tracking-widest z-10"
        >
          <MessageSquarePlus size={14} />
          New Chat
        </button>
      )}
      <div className="flex-1 overflow-y-auto pr-4 space-y-8 pb-32 pt-8">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            {activeDocument ? (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-indigo/30 rounded-xl mb-4 flex items-center justify-center border border-brass/20 text-brass">
                  <FileText size={40} />
                </div>
                <h2 className="font-hero text-2xl text-parchment mb-2">Active Document</h2>
                <p className="font-data-mono text-fog mb-8">{activeDocument}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-indigo text-parchment border border-brass/30 rounded-lg hover:bg-brass hover:text-ink transition-colors font-ui-label flex items-center gap-2"
                >
                  <UploadCloud size={18} />
                  Add or Replace Document
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-60">
                <div className="w-32 h-32 border border-dashed border-fog rounded-lg mb-6 flex items-center justify-center">
                  <BookOpenIcon />
                </div>
                <h2 className="font-hero text-2xl text-brass mb-2">Ready to explore.</h2>
                <p className="font-body text-fog max-w-[40ch] mb-8">Begin typing to ask a question against your local knowledge base.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-indigo text-parchment border border-brass/30 rounded-lg hover:bg-brass hover:text-ink transition-colors font-ui-label flex items-center gap-2"
                >
                  <UploadCloud size={18} />
                  Upload Document
                </button>
              </div>
            )}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] font-body ${m.role === 'user' ? 'bg-indigo text-parchment rounded-2xl rounded-tr-sm p-4' : 'text-parchment py-2'}`}>
                {m.role === 'assistant' && <div className="text-brass font-ui-label text-xs mb-1 uppercase tracking-widest">Atlas</div>}
                
                <div className="markdown-body">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full text-left border-collapse" {...props} /></div>,
                      th: ({node, ...props}) => <th className="border-b border-fog/30 p-2 font-ui-label text-brass bg-indigo/20" {...props} />,
                      td: ({node, ...props}) => <td className="border-b border-fog/10 p-2" {...props} />,
                      a: ({node, ...props}) => <a className="text-brass underline decoration-brass/30 underline-offset-2 hover:decoration-brass" {...props} />,
                      p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4 space-y-1" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-2xl font-hero text-brass mb-4 mt-6" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-hero text-brass mb-3 mt-5" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-hero text-parchment mb-2 mt-4" {...props} />,
                      code: ({node, inline, ...props}) => inline ? <code className="bg-ink/50 text-fog px-1.5 py-0.5 rounded text-sm font-data-mono" {...props} /> : <pre className="bg-ink/50 p-4 rounded-lg overflow-x-auto text-sm font-data-mono text-fog my-4 border border-fog/20"><code {...props} /></pre>
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
                
                {m.role === 'assistant' && m.sources && m.sources.length > 0 && !m.isStreaming && (
                  <div className="mt-4 pt-4 border-t border-fog/10 flex flex-wrap gap-2">
                    <span className="text-[10px] uppercase font-ui-label text-fog self-center">Sources:</span>
                    {m.sources.map((src, idx) => (
                      <CitationChip 
                        key={idx} 
                        id={idx + 1} 
                        sourceData={src}
                        onClick={handleCitationClick} 
                      />
                    ))}
                  </div>
                )}
                
                {m.isStreaming && <span className="inline-block w-2 h-4 bg-brass ml-1 animate-pulse align-middle" />}
              </div>
            </div>
          ))
        )}
        
        {suggestions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2 mt-4"
          >
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSubmit(null, sug)}
                className="px-3 py-1.5 rounded-full border border-brass/30 text-brass text-sm font-ui-label hover:bg-brass/10 transition-colors"
              >
                {sug}
              </button>
            ))}
          </motion.div>
        )}
        
        <div ref={endRef} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-ink via-ink to-transparent">
        <form onSubmit={(e) => handleSubmit(e)} className="max-w-3xl mx-auto relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <div className="pointer-events-none">
              <CompassSpinner isSpinning={isLoading} />
            </div>
            
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`transition-colors disabled:opacity-50 z-10 ${activeDocument ? 'text-brass hover:text-parchment' : 'text-fog hover:text-brass'}`}
                disabled={isLoading || isUploading}
                title="Upload Document"
              >
                <Paperclip size={20} />
              </button>
              {activeDocument && !isUploading && (
                <button
                  type="button"
                  onClick={() => setActiveDocument(null)}
                  className="absolute -top-2 -right-3 text-rust hover:text-red-400 bg-ink rounded-full border border-rust/50 p-[2px] transition-colors z-20"
                  title="Discard Active Document"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>

            {isUploading && uploadProgress && (
              <span className="text-brass text-xs font-data-mono absolute left-16 whitespace-nowrap">
                {uploadProgress.phase === 'uploading' ? 'UP' : 'EMB'} {Math.round(uploadProgress.percent)}%
              </span>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.md,.txt,.csv,.jpg,.jpeg,.png,.webp"
            className="hidden"
          />
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeDocument ? `Ask about ${activeDocument}...` : "Ask a question about your documents..."}
            className={`w-full bg-indigo/50 border border-fog/20 rounded-xl py-4 ${isUploading ? 'pl-36' : 'pl-20'} pr-12 font-body text-parchment placeholder:text-fog focus:outline-none focus:border-brass transition-all backdrop-blur-md`}
            disabled={isLoading || isUploading}
          />
          <button 
            type="submit" 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-brass hover:text-parchment disabled:opacity-50 transition-colors"
            disabled={!input.trim() || isLoading || isUploading}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}

function BookOpenIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-fog">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  );
}
