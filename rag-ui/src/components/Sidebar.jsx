import DropZone from './DropZone';
import FileList from './FileList';
import VectorCounter from './VectorCounter';
import Button from './ui/Button';
import Tooltip from './ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, MessageSquare, Trash2, Loader2, Home, User, MoreHorizontal } from 'lucide-react';
import { useHealth } from '../hooks/useHealth';

const HEALTH_META = {
  online: { label: 'System Online', dot: 'bg-status-success animate-pulse-status', text: 'text-status-success' },
  degraded: { label: 'Pipeline Warming', dot: 'bg-amber-400 animate-pulse-status', text: 'text-amber-400' },
  offline: { label: 'Backend Offline', dot: 'bg-status-error', text: 'text-status-error' },
  checking: { label: 'Connecting…', dot: 'bg-surface-4', text: 'text-text-muted' },
};

export default function Sidebar({
  files, vectorCount, isUploading, uploadProgress, onUpload,
  chatHistory, currentSessionId, startNewChat, loadSession, deleteSession,
  onNavigate,
}) {
  const navigate = useNavigate();
  const { status, model, recheck } = useHealth();
  const health = HEALTH_META[status] || HEALTH_META.checking;

  const hasHistory = chatHistory && chatHistory.length > 0;
  const hasFiles = files && files.length > 0;
  const isEmpty = !hasHistory && !hasFiles;

  return (
    <motion.div className="relative w-[min(100vw,20rem)] sm:w-80 h-full flex flex-col bg-surface-0/95 backdrop-blur-2xl border-r border-border-default z-20 shadow-[4px_0_24px_rgba(0,0,0,0.04)]" initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/40 to-transparent" />

      {/* ── Header ── */}
      <div className="p-6 border-b border-border-subtle">
        <div className="flex items-center gap-3 mb-5">
          <motion.div
            whileHover={{ rotate: 8, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shadow-glow"
          >
            <Zap className="w-4 h-4 text-accent-primary" />
          </motion.div>
          <div>
            <h1 className="font-display font-semibold text-text-primary text-sm tracking-tight">RAG Agent</h1>
            <span className="text-[10px] text-text-dim font-mono uppercase tracking-label">{model ? model.replace(':latest', '') : 'Local · Private'}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="md"
            className="w-full rounded-xl shadow-[0_2px_10px_rgba(242,184,75,0.22)]"
            onClick={() => {
              startNewChat();
              onNavigate?.();
            }}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
          <Button
            variant="outline"
            size="md"
            className="w-full text-text-muted rounded-xl"
            onClick={() => {
              navigate('/');
              onNavigate?.();
            }}
          >
            <Home className="w-4 h-4" />
            Back to home
          </Button>
        </div>
      </div>

      {/* ── Scrollable Middle Section ── */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
        {/* Upload Zone */}
        <div className="px-4 py-4 shrink-0">
          <DropZone
            onUpload={onUpload}
            isUploading={isUploading}
            progress={uploadProgress}
          />
        </div>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-text-dim" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">No documents yet</p>
            <p className="text-xs text-text-muted text-balance">
              Upload a PDF to start building your local knowledge base.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* File List */}
            {hasFiles && (
              <div className="shrink-0">
                <FileList files={files} />
              </div>
            )}
            
            {/* Chat History */}
            {hasHistory && (
              <div className="px-4 pt-4 pb-6">
                <h3 className="text-[10px] font-mono uppercase tracking-label text-text-dim mb-3 px-1">Chat History</h3>
                <div className="flex flex-col gap-0.5">
                  <AnimatePresence>
                    {chatHistory.map((session, idx) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg w-full text-left transition-all duration-200 group relative ${currentSessionId === session.id
                            ? 'bg-surface-3 text-text-primary shadow-card'
                            : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                          }`}
                      >
                        {currentSessionId === session.id && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-accent-primary shadow-glow" />
                        )}
                        <button
                          onClick={() => {
                            loadSession(session.id);
                            onNavigate?.();
                          }}
                          className="flex items-center gap-2 flex-1 min-w-0 focus-visible:outline-none"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-accent-primary/50 group-hover:text-accent-primary transition-colors" />
                          <span className="text-xs truncate leading-snug" title={session.title}>{session.title}</span>
                        </button>
                        {deleteSession && (
                          <Tooltip label="Delete chat" side="right">
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-status-error/10 hover:text-status-error text-text-dim transition-all duration-200 shrink-0 focus-visible:outline-none"
                              aria-label="Delete chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </motion.button>
                          </Tooltip>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Pinned Bottom Section ── */}
      <div className="shrink-0 border-t border-border-default bg-surface-0/50">
        <VectorCounter count={vectorCount} />
        
        {/* User Profile Section */}
        <div className="px-4 py-3 mx-2 mb-2 mt-1 rounded-xl bg-surface-1/50 border border-border-subtle hover:border-border-default transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-primary/10 flex items-center justify-center border border-accent-primary/20 shrink-0 shadow-sm">
              <User className="w-4 h-4 text-accent-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-text-primary truncate">Local User</h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                {status === 'checking' ? (
                  <Loader2 className="w-2 h-2 text-text-dim animate-spin shrink-0" />
                ) : (
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${health.dot}`} />
                )}
                <span className={`text-[9px] font-mono uppercase tracking-label truncate ${health.text}`}>{health.label}</span>
              </div>
            </div>
            {status === 'offline' ? (
              <button 
                onClick={recheck}
                className="px-2 py-1 rounded-md bg-surface-2 hover:bg-surface-3 text-[10px] font-mono font-medium text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 shrink-0"
              >
                Retry
              </button>
            ) : (
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors focus-visible:outline-none shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}