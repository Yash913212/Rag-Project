import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '../components/ui/toastContext';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
const POLL_INTERVAL = 10000;

let checkingId = 0;

export function useHealth() {
  const [status, setStatus] = useState('checking');
  const [model, setModel] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const warnedRef = useRef(false);
  const { toast } = useToast();

  const check = useCallback(async () => {
    const id = ++checkingId;
    let next = 'offline';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        next = data.status === 'ok' ? 'online' : 'degraded';
        setModel(data.model || null);
      }
    } catch {
      next = 'offline';
    }
    if (id === checkingId) {
      setStatus(next);
      setLastChecked(new Date());
    }
    if (next === 'offline' && !warnedRef.current) {
      warnedRef.current = true;
      toast('Backend unreachable — is FastAPI running on port 8000?', 'error', 6000);
    }
    if (next !== 'offline') warnedRef.current = false;
  }, [toast]);

  useEffect(() => {
    const initial = setTimeout(() => {
      check();
    }, 0);
    const interval = setInterval(check, POLL_INTERVAL);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [check]);

  return { status, model, lastChecked, recheck: check };
}