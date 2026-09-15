import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Book, MessageSquare, Layers, Map, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeSettings } from './ThemeSettings';

export function Rail() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const links = [
    { to: '/', icon: Compass, label: 'Home' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    { to: '/library', icon: Book, label: 'Library' },
    { to: '/map', icon: Map, label: 'Knowledge Map' },
    { to: '/study', icon: Layers, label: 'Study Mode' },
  ];

  return (
    <>
      <nav className="w-16 h-screen border-r border-fog/20 flex flex-col items-center py-6 gap-6 shrink-0 bg-ink z-10 sm:w-16 sm:h-screen fixed bottom-0 w-full sm:static sm:flex-col flex-row justify-around sm:justify-start">
        <div className="w-8 h-8 rounded bg-brass flex items-center justify-center mb-4 hidden sm:flex">
          <Compass size={20} className="text-ink" />
        </div>
        
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `group relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                isActive ? 'text-brass' : 'text-fog hover:text-parchment'
              }`
            }
          >
            {({ isActive }) => (
              <>
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
              </>
            )}
          </NavLink>
        ))}

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
      
      <ThemeSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
