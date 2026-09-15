import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Rail } from './components/Rail';
import { Landing } from './pages/Landing';
import { Chat } from './pages/Chat';
import { Library } from './pages/Library';
import { KnowledgeMap } from './pages/KnowledgeMap';
import { StudyMode } from './pages/StudyMode';
import { Inspector } from './components/Inspector';
import { UIProvider, useUI } from './context/UIContext';

function AppContent() {
  const location = useLocation();
  const { inspectorOpen, inspectorContent, closeInspector } = useUI();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="flex h-screen bg-ink text-parchment overflow-hidden">
      <Rail />
      
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full absolute inset-0 overflow-auto"
          >
            <Routes location={location}>
              <Route path="/" element={<Landing />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/library" element={<Library />} />
              <Route path="/map" element={<KnowledgeMap />} />
              <Route path="/study" element={<StudyMode />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      <Inspector 
        isOpen={inspectorOpen} 
        onClose={closeInspector} 
        content={inspectorContent} 
      />
    </div>
  );
}

import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <UIProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </UIProvider>
    </ThemeProvider>
  );
}

export default App;
