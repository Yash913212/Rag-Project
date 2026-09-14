import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '../components/ui/toastContext';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

let idCounter = 0;
const nextId = () => Date.now() + ++idCounter;

const loadChatHistory = () => {
  try {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const restoreMessages = (messages) =>
  messages
    .filter((m) => m.role !== 'assistant' || m.content)
    .map((m) => ({ ...m, isStreaming: false, timestamp: new Date(m.timestamp) }));

export function useRAG() {
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState([]);
  const [vectorCount, setVectorCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const cancelRef = useRef(null);
  const saveTimerRef = useRef(null);
  const { toast } = useToast();

  const [currentSessionId, setCurrentSessionId] = useState(() => nextId().toString());
  const [chatHistory, setChatHistory] = useState(loadChatHistory);

  const messagesRef = useRef(messages);
  const sessionRef = useRef(currentSessionId);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sessionRef.current = currentSessionId;
  }, [currentSessionId]);

  const persistHistory = useCallback(() => {
    const msgs = messagesRef.current;
    const sid = sessionRef.current;
    if (!msgs.length) return;

    setChatHistory((prev) => {
      const existingSession = prev.find((s) => s.id === sid);
      const title =
        existingSession?.title ||
        (msgs.find((m) => m.role === 'user')?.content.substring(0, 30) || 'New Chat') + '...';

      const updatedSession = {
        id: sid,
        title,
        messages: restoreMessages(msgs),
        timestamp: existingSession?.timestamp || new Date().toISOString(),
      };

      const newHistory = existingSession
        ? prev.map((s) => (s.id === sid ? updatedSession : s))
        : [updatedSession, ...prev];

      localStorage.setItem('chatHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const persistDebounced = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      persistHistory();
    }, 500);
  }, [persistHistory]);

  const flushPersist = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    persistHistory();
  }, [persistHistory]);

  useEffect(() => {
    if (messages.length > 0) persistDebounced();
  }, [messages, persistDebounced]);

  const abortGeneration = useCallback(() => {
    cancelRef.current?.abort();
    cancelRef.current = null;
  }, []);

  const sendMessage = useCallback(async (query, opts = {}) => {
    if (!query.trim() || isProcessing) return;
    const q = query.trim();

    if (!opts.reuseUser) {
      const userMsg = {
        id: nextId(),
        role: 'user',
        content: q,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }

    setIsProcessing(true);

    const controller = new AbortController();
    cancelRef.current = controller;

    try {
      const response = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: q }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const aiMsg = {
        id: nextId(),
        role: 'assistant',
        content: '',
        sources: [],
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, aiMsg]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'sources') {
              setMessages((prev) => prev.map((m) => (m.id === aiMsg.id ? { ...m, sources: data.sources } : m)));
            } else if (data.type === 'content') {
              setMessages((prev) => prev.map((m) => (m.id === aiMsg.id ? { ...m, content: m.content + data.token } : m)));
            } else if (data.type === 'end') {
              setMessages((prev) => prev.map((m) => (m.id === aiMsg.id ? { ...m, isStreaming: false } : m)));
              flushPersist();
            }
          } catch (e) {
            console.warn("SSE parse error", e, line);
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error("Chat error:", error);
      const isConnectionError = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
      const content = isConnectionError
        ? '**Connection Error:** Could not reach the local Llama 3.2 backend. Is the FastAPI server running on port 8000?'
        : `**Error:** ${error.message}`;

      const errorMsg = {
        id: nextId(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        isStreaming: false,
      };
      setMessages((prev) => [...prev, errorMsg]);
      if (isConnectionError) toast('Backend unreachable — is FastAPI running on port 8000?', 'error', 6000);
    } finally {
      if (cancelRef.current === controller) cancelRef.current = null;
      setIsProcessing(false);
    }
  }, [isProcessing, flushPersist, toast]);

  const regenerate = useCallback(() => {
    if (isProcessing) return;
    const lastUserIdx = messages.reduce((acc, m, i) => (m.role === 'user' ? i : acc), -1);
    if (lastUserIdx === -1) return;
    const query = messages[lastUserIdx].content;
    setMessages((prev) => prev.slice(0, lastUserIdx));
    sendMessage(query, { reuseUser: true });
  }, [messages, isProcessing, sendMessage]);

  const stopGenerating = useCallback(() => {
    abortGeneration();
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'assistant' && last.isStreaming) {
        return prev.slice(0, -1);
      }
      return prev;
    });
    setIsProcessing(false);
  }, [abortGeneration]);

  const uploadFile = useCallback(async (file) => {
    if (isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);

    const newFile = {
      id: nextId(),
      name: file.name,
      size: file.size,
      status: 'processing',
      chunks: 0,
    };

    setFiles((prev) => [...prev, newFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let detail = `Upload failed (${response.status})`;
        try {
          const data = await response.json();
          if (data?.detail) detail = data.detail;
        } catch { /* non-JSON error body */ }
        throw new Error(detail);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let processedChunks = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          const data = JSON.parse(jsonStr);
          if (data.type === 'progress') setUploadProgress(data.percent);
          if (data.type === 'done') processedChunks = data.chunks_added;
          if (data.type === 'error') throw new Error(data.message);
        }
      }

      setUploadProgress(100);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === newFile.id ? { ...f, status: 'complete', chunks: processedChunks } : f
        )
      );
      setVectorCount((prev) => prev + processedChunks);
      toast(`Indexed ${processedChunks} chunks from ${file.name}`, 'success');
    } catch (error) {
      console.error("Upload error:", error);
      setFiles((prev) => prev.filter((f) => f.id !== newFile.id));
      toast(error.message || 'Failed to process that PDF.', 'error');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
      }, 500);
    }
  }, [isUploading, toast]);

  const clearChat = useCallback(() => {
    abortGeneration();
    setMessages([]);
    setIsProcessing(false);
  }, [abortGeneration]);

  const startNewChat = useCallback(() => {
    abortGeneration();
    setMessages([]);
    setCurrentSessionId(nextId().toString());
    setIsProcessing(false);
  }, [abortGeneration]);

  const loadSession = useCallback((id) => {
    abortGeneration();
    const session = chatHistory.find((s) => s.id === id);
    if (session) {
      setMessages(restoreMessages(session.messages));
      setCurrentSessionId(id);
      setIsProcessing(false);
    }
  }, [chatHistory, abortGeneration]);

  const deleteSession = useCallback((id) => {
    setChatHistory((prev) => {
      const newHistory = prev.filter((s) => s.id !== id);
      localStorage.setItem('chatHistory', JSON.stringify(newHistory));
      return newHistory;
    });
    if (id === currentSessionId) {
      abortGeneration();
      setMessages([]);
      setCurrentSessionId(nextId().toString());
      setIsProcessing(false);
    }
  }, [currentSessionId, abortGeneration]);

  return {
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
  };
}