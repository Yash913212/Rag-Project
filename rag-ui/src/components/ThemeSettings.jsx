import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Check, User, Database, Layers } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { API_BASE } from "../config";

export function ThemeSettings({ isOpen, onClose }) {
  const { themeMode, setThemeMode, accent, setAccent } = useTheme();
  const [stats, setStats] = useState({ docs: 0, chunks: 0 });

  useEffect(() => {
    const fetchStats = () => {
      fetch(`${API_BASE}/documents`)
        .then(res => res.json())
        .then(data => {
          const docs = data.length;
          const chunks = data.reduce((acc, doc) => acc + doc.chunks, 0);
          setStats({ docs, chunks });
        })
        .catch(console.error);
    };

    if (isOpen) {
      fetchStats();
    }
    
    window.addEventListener("documentUpdated", fetchStats);
    return () => window.removeEventListener("documentUpdated", fetchStats);
  }, [isOpen]);

  const accents = [
    { id: "brass", name: "Brass", color: "bg-[#C08A3E]" },
    { id: "rust", name: "Rust", color: "bg-[#B0503A]" },
    { id: "moss", name: "Moss", color: "bg-[#4C7A63]" },
    { id: "indigo", name: "Indigo", color: "bg-[#263352]" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-24 left-4 sm:bottom-4 sm:left-20 z-50 w-64 bg-indigo text-parchment p-6 rounded-xl border border-brass/20 shadow-2xl"
          >
            <h3 className="font-hero text-xl text-brass mb-4">Settings</h3>

            <div className="mb-6 bg-ink/50 p-4 rounded-xl border border-fog/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brass/20 flex items-center justify-center text-brass">
                  <User size={20} />
                </div>
                <div>
                  <div className="font-ui-label text-parchment font-medium">Guest User</div>
                  <div className="font-data-mono text-fog text-[10px] uppercase">Local Workspace</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-fog/10">
                <div className="flex flex-col items-center p-2 bg-ink rounded-lg border border-fog/5">
                  <Database size={14} className="text-moss mb-1" />
                  <span className="font-data-mono text-sm text-parchment">{stats.docs}</span>
                  <span className="font-ui-label text-[10px] text-fog uppercase tracking-widest mt-1">Docs</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-ink rounded-lg border border-fog/5">
                  <Layers size={14} className="text-rust mb-1" />
                  <span className="font-data-mono text-sm text-parchment">{stats.chunks}</span>
                  <span className="font-ui-label text-[10px] text-fog uppercase tracking-widest mt-1">Chunks</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="font-ui-label text-xs uppercase tracking-widest text-fog mb-3">
                Mode
              </div>
              <div className="flex bg-ink p-1 rounded-lg">
                <button
                  onClick={() => setThemeMode("light")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-ui-label transition-colors ${
                    themeMode === "light"
                      ? "bg-indigo text-brass shadow"
                      : "text-fog hover:text-parchment"
                  }`}
                >
                  <Sun size={16} /> Light
                </button>
                <button
                  onClick={() => setThemeMode("dark")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md font-ui-label transition-colors ${
                    themeMode === "dark"
                      ? "bg-indigo text-brass shadow"
                      : "text-fog hover:text-parchment"
                  }`}
                >
                  <Moon size={16} /> Dark
                </button>
              </div>
            </div>

            <div>
              <div className="font-ui-label text-xs uppercase tracking-widest text-fog mb-3">
                Accent Color
              </div>
              <div className="flex justify-between">
                {accents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAccent(item.id)}
                    className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-ink hover:bg-ink/80 transition-colors"
                  >
                    <div
                      className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center transition-transform group-hover:scale-110`}
                    >
                      {accent === item.id && (
                        <Check size={14} className="text-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
