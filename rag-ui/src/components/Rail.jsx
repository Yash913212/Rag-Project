import { useState, useEffect } from "react";
import {
  Compass,
  Book,
  MessageSquare,
  Layers,
  Map,
  Settings,
} from "lucide-react";
import { motion } from "framer-motion";
import { ThemeSettings } from "./ThemeSettings";

export function Rail() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const initialPath = window.location.pathname.slice(1).toLowerCase();
    if (initialPath) {
      const el = document.getElementById(initialPath);
      if (el) setTimeout(() => el.scrollIntoView(), 100);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            setActiveSection(id);
            const pathName = id.charAt(0).toUpperCase() + id.slice(1);
            window.history.replaceState(null, '', '/' + pathName);
          }
        });
      },
      { threshold: 0.5 }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  const links = [
    { id: "home", icon: Compass, label: "Home" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "library", icon: Book, label: "Library" },
    { id: "map", icon: Map, label: "Knowledge Map" },
    { id: "study", icon: Layers, label: "Study Mode" },
  ];

  return (
    <>
      <nav className="w-full h-16 sm:w-16 sm:h-full border-t sm:border-t-0 sm:border-r border-fog/20 flex flex-row sm:flex-col items-center justify-around sm:justify-start sm:py-6 px-4 sm:px-0 gap-2 sm:gap-6 shrink-0 bg-ink z-50">
        <button 
          onClick={() => {
            const el = document.getElementById("home");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center mb-4 hidden sm:flex hover:scale-105 transition-transform ring-2 ring-brass/20 hover:ring-brass/50"
        >
          <img src="/logo.jpg" alt="App Logo" className="w-full h-full object-cover" />
        </button>

        {links.map((link) => {
          const isActive = activeSection === link.id;
          return (
            <a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(link.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={`group relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                isActive ? "text-brass" : "text-fog hover:text-parchment"
              }`}
            >
              <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {isActive && (
                <motion.div
                  layoutId="rail-indicator"
                  className="absolute inset-0 border border-brass/50 rounded-lg pointer-events-none"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="absolute left-full ml-4 px-2 py-1 bg-indigo/90 backdrop-blur text-parchment text-xs font-ui-label rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-lg hidden sm:block z-50">
                {link.label}
              </div>
            </a>
          );
        })}

        <div className="mt-auto hidden sm:block">
          <button
            onClick={() => setSettingsOpen(true)}
            className="group relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors text-fog hover:text-parchment"
          >
            <Settings size={22} strokeWidth={2} />
            <div className="absolute left-full ml-4 px-2 py-1 bg-indigo/90 backdrop-blur text-parchment text-xs font-ui-label rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity shadow-lg z-50">
              Settings
            </div>
          </button>
        </div>
      </nav>

      <ThemeSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
