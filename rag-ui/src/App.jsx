import Sidebar from './components/Sidebar';
import ChatCanvas from './components/ChatCanvas';
import AmbientBackground from './components/ui/AmbientBackground';
import { useRAG } from './hooks/useRAG';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function App() {
  const {
    messages,
    isProcessing,
    files,
    vectorCount,
    isUploading,
    uploadProgress,
    sendMessage,
    regenerate,
    stopGenerating,
    uploadFile,
    clearChat,
    chatHistory,
    currentSessionId,
    startNewChat,
    loadSession,
    deleteSession,
  } = useRAG();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <motion.div className="flex h-screen w-screen bg-surface-0 overflow-hidden font-sans relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      <AmbientBackground />

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-surface-0/80 z-20 md:hidden backdrop-blur-md"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Collapsible on Mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <Sidebar
          files={files}
          vectorCount={vectorCount}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          onUpload={uploadFile}
          chatHistory={chatHistory}
          currentSessionId={currentSessionId}
          startNewChat={startNewChat}
          loadSession={loadSession}
          deleteSession={deleteSession}
          onNavigate={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        {/* Mobile Header Toggle */}
        <div className="md:hidden flex items-center h-12 px-4 border-b border-border-default bg-surface-0/90 backdrop-blur-md">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-8 h-8 -ml-1 inline-flex items-center justify-center rounded-lg text-text-secondary hover:text-accent-primary hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
            aria-label="Open sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-display font-semibold text-text-primary ml-2">RAG Agent</span>
        </div>

        <ChatCanvas
          messages={messages}
          isProcessing={isProcessing}
          onSend={sendMessage}
          onRegenerate={regenerate}
          onStop={stopGenerating}
          onClear={clearChat}
        />
      </div>
    </motion.div>
  );
}