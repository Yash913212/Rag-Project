import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Compass,
  MessageSquarePlus,
  Paperclip,
  UploadCloud,
  FileText,
  X,
} from "lucide-react";
import { useUI } from "../context/UIContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_BASE } from "../config";

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
        ease: "linear",
      }}
      className="text-fog"
    >
      <Compass size={20} />
    </motion.div>
  );
}

export function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const { openInspector } = useUI();
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const dragCounter = useRef(0);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSuggestions([]);
    setInput("");
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
            docs.sort(
              (a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at),
            );
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

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload({ target: { files: [file] } });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    setUploadProgress({ phase: "uploading", percent: 0 });

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const textChunk = decoder.decode(value, { stream: true });
          const lines = textChunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.type === "progress") {
                  setUploadProgress({
                    phase: data.phase,
                    percent: data.percent,
                  });
                } else if (data.type === "done") {
                  setActiveDocument(file.name);
                  setMessages((prev) => [
                    ...prev,
                    {
                      role: "assistant",
                      content: `You have uploaded **${file.name}** and I am using this document. What would you like to know?`,
                      sources: [],
                    },
                  ]);
                  setSuggestions([
                    "Summarize this document",
                    "What are the key takeaways?",
                    "What is the main topic?",
                  ]);
                  setUploadProgress(null);
                  window.dispatchEvent(new Event("documentUpdated"));
                } else if (data.type === "error") {
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
      alert("Failed to upload file");
      setUploadProgress(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async () => {
    if (!activeDocument) return;
    try {
      const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(activeDocument)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActiveDocument(null);
      } else {
        alert("Failed to delete document");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete document");
    }
  };

  const handleSubmit = async (e, forcedInput = null) => {
    if (e) e.preventDefault();
    const query = forcedInput || input;
    if (!query.trim()) return;

    const newMsg = { role: "user", content: query };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [
      ...prev,
      newMsg,
      { role: "assistant", content: "", isStreaming: true, sources: [] },
    ]);
    setInput("");
    setIsLoading(true);
    setSuggestions([]);

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history, document: activeDocument }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const textChunk = decoder.decode(value, { stream: true });
          const lines = textChunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));

                setMessages((prev) => {
                  const copy = [...prev];
                  const last = { ...copy[copy.length - 1] };

                  if (data.type === "sources") {
                    last.sources = data.sources;
                  } else if (data.type === "content") {
                    last.content += data.token;
                  } else if (data.type === "end") {
                    last.isStreaming = false;
                    setSuggestions(data.suggestions || []);
                  }

                  copy[copy.length - 1] = last;
                  return copy;
                });
              } catch (e) {
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
    <div 
      className="h-full flex flex-col py-4 sm:py-8 px-4 sm:px-8 relative w-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <header className="mb-4 sm:mb-8 shrink-0 max-w-5xl mx-auto w-full">
        <h1 className="font-hero text-4xl text-brass mb-2">Chat</h1>
        <p className="font-body text-fog text-sm sm:text-base max-w-2xl">
          Converse directly with your documents. Ask questions, extract insights, and get answers backed by exact citations.
        </p>
      </header>
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-sm border-2 border-dashed border-brass rounded-xl m-4 pointer-events-none">
          <div className="text-brass flex flex-col items-center gap-4">
            <UploadCloud size={64} className="animate-bounce" />
            <h2 className="font-hero text-2xl">Drop document to upload</h2>
          </div>
        </div>
      )}
      {messages.length > 0 && (
        <div className="absolute top-4 sm:top-8 right-4 sm:right-8 z-10">
          <button
            onClick={handleNewChat}
            className="px-3 py-1.5 bg-indigo/50 backdrop-blur-sm text-brass border border-brass/20 rounded-lg font-ui-label hover:bg-brass hover:text-ink transition-colors flex items-center gap-2 text-xs uppercase tracking-widest"
          >
            <MessageSquarePlus size={14} />
            New Chat
          </button>
        </div>
      )}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-6 sm:space-y-8 pb-24 sm:pb-32 pt-4 sm:pt-8 max-w-3xl mx-auto w-full pr-2 sm:pr-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            {activeDocument ? (
              <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 bg-indigo/30 rounded-xl mb-4 flex items-center justify-center border border-brass/20 text-brass">
                  <FileText size={40} />
                  <button
                    onClick={handleDeleteDocument}
                    className="absolute -top-3 -right-3 bg-rust text-parchment p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-lg z-20"
                    title="Delete Document"
                  >
                    <X size={16} />
                  </button>
                </div>
                <h2 className="font-hero text-2xl text-parchment mb-2">
                  Active Document
                </h2>
                <p className="font-data-mono text-fog mb-8">{activeDocument}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-indigo text-parchment border border-brass/30 rounded-lg hover:bg-brass hover:text-ink transition-colors font-ui-label flex items-center gap-2"
                >
                  <UploadCloud size={18} />
                  Upload New Document
                </button>
              </div>
            ) : (
              <div 
                className={`flex flex-col items-center justify-center w-full max-w-md border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all ${isDragging ? "border-brass bg-brass/10" : "border-fog/30 hover:bg-indigo/30 hover:border-brass/50"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={48} className="text-brass mb-4" />
                <h2 className="font-hero text-2xl text-parchment mb-2">
                  Drag & Drop
                </h2>
                <p className="font-body text-fog mb-6">
                  or click to upload your document
                </p>
                <div className="px-6 py-2 bg-indigo text-parchment border border-brass/30 rounded-lg hover:bg-brass hover:text-ink transition-colors font-ui-label text-sm uppercase tracking-widest pointer-events-none">
                  Upload File
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[80%] font-body ${m.role === "user" ? "bg-indigo text-parchment rounded-2xl rounded-tr-sm p-3 sm:p-4" : "text-parchment py-2"}`}
              >
                {m.role === "assistant" && (
                  <div className="text-brass font-ui-label text-xs mb-1 uppercase tracking-widest">
                    Atlas
                  </div>
                )}

                <div className="markdown-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-4">
                          <table
                            className="w-full text-left border-collapse"
                            {...props}
                          />
                        </div>
                      ),
                      th: ({ node, ...props }) => (
                        <th
                          className="border-b border-fog/30 p-2 font-ui-label text-brass bg-indigo/20"
                          {...props}
                        />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="border-b border-fog/10 p-2" {...props} />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          className="text-brass underline decoration-brass/30 underline-offset-2 hover:decoration-brass"
                          {...props}
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p
                          className="mb-4 last:mb-0 leading-relaxed"
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul
                          className="list-disc pl-6 mb-4 space-y-1"
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol
                          className="list-decimal pl-6 mb-4 space-y-1"
                          {...props}
                        />
                      ),
                      h1: ({ node, ...props }) => (
                        <h1
                          className="text-2xl font-hero text-brass mb-4 mt-6"
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className="text-xl font-hero text-brass mb-3 mt-5"
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className="text-lg font-hero text-parchment mb-2 mt-4"
                          {...props}
                        />
                      ),
                      code: ({ node, inline, ...props }) =>
                        inline ? (
                          <code
                            className="bg-ink/50 text-fog px-1.5 py-0.5 rounded text-sm font-data-mono"
                            {...props}
                          />
                        ) : (
                          <pre className="bg-ink/50 p-4 rounded-lg overflow-x-auto text-sm font-data-mono text-fog my-4 border border-fog/20">
                            <code {...props} />
                          </pre>
                        ),
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>

                {m.role === "assistant" &&
                  m.sources &&
                  m.sources.length > 0 &&
                  !m.isStreaming && (
                    <div className="mt-4 pt-4 border-t border-fog/10 flex flex-wrap gap-2">
                      <span className="text-[10px] uppercase font-ui-label text-fog self-center">
                        Sources:
                      </span>
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

                {m.isStreaming && (
                  <span className="inline-flex gap-1 ml-1 align-middle h-4 items-center">
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-brass rounded-full" />
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-brass rounded-full" />
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-brass rounded-full" />
                  </span>
                )}
              </div>
            </div>
          ))
        )}

        {isUploading && uploadProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-ink/80 backdrop-blur-md rounded-xl m-4 border border-brass/10"
          >
            <div className="relative w-32 h-32 mb-8">
              {/* Central Core */}
              <motion.div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-brass shadow-[0_0_30px_rgba(192,138,62,0.8)] z-10"
                animate={{ scale: [1, 1.5, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Orbiting Chunks (Data Absorption) */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-parchment shadow-[0_0_5px_#E8E1D0]"
                  initial={{ 
                    x: Math.cos(i * (Math.PI / 4)) * 60, 
                    y: Math.sin(i * (Math.PI / 4)) * 60,
                    opacity: 0,
                    scale: 0
                  }}
                  animate={{ 
                    x: 0, 
                    y: 0,
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "circIn"
                  }}
                />
              ))}
              
              {/* Outer Scanning Ring */}
              <motion.div 
                className="absolute inset-0 rounded-full border border-brass/20"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute top-0 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brass shadow-[0_0_10px_#C08A3E]" />
                <div className="absolute bottom-0 left-1/2 w-1 h-1 -translate-x-1/2 translate-y-1/2 rounded-full bg-parchment shadow-[0_0_5px_#E8E1D0]" />
              </motion.div>
            </div>
            
            <h3 className="font-hero text-2xl text-brass mb-2 tracking-wider">
              {uploadProgress.phase === "uploading" ? "UPLOADING" : "ANALYZING"}
            </h3>
            <div className="font-data-mono text-fog tracking-widest text-sm">
              {Math.round(uploadProgress.percent)}% COMPLETE
            </div>
          </motion.div>
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
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-ink via-ink to-transparent pointer-events-none">
        <form
          onSubmit={(e) => handleSubmit(e)}
          className="max-w-3xl mx-auto relative pointer-events-auto"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <div className="pointer-events-none">
              <CompassSpinner isSpinning={isLoading} />
            </div>

            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`transition-colors disabled:opacity-50 z-10 ${activeDocument ? "text-brass hover:text-parchment" : "text-fog hover:text-brass"}`}
                disabled={isLoading || isUploading}
                title="Upload Document"
              >
                <Paperclip size={20} />
              </button>
              {activeDocument && !isUploading && (
                <button
                  type="button"
                  onClick={handleDeleteDocument}
                  className="absolute -top-2 -right-3 text-rust hover:text-red-400 bg-ink rounded-full border border-rust/50 p-[2px] transition-colors z-20"
                  title="Delete Active Document"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>

          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.md,.txt,.csv,.jpg,.jpeg,.png,.webp"
            className="hidden"
          />

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isLoading && !isUploading) {
                  handleSubmit(e);
                  if (textareaRef.current) textareaRef.current.style.height = "auto";
                }
              }
            }}
            placeholder={
              activeDocument
                ? `Ask about ${activeDocument}...`
                : "Ask a question about your documents..."
            }
            className={`w-full bg-indigo/50 border border-fog/20 rounded-xl py-3 sm:py-4 ${isUploading ? "pl-36" : "pl-16 sm:pl-20"} pr-10 sm:pr-12 font-body text-parchment placeholder:text-fog focus:outline-none focus:border-brass transition-all backdrop-blur-md text-sm sm:text-base resize-none overflow-y-auto leading-relaxed block`}
            disabled={isLoading || isUploading}
            style={{ minHeight: "52px" }}
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
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-fog"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  );
}
