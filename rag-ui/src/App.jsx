import { BrowserRouter } from "react-router-dom";
import { motion } from "framer-motion";
import { Rail } from "./components/Rail";
import { Landing } from "./pages/Landing";
import { Chat } from "./pages/Chat";
import { Library } from "./pages/Library";
import { KnowledgeMap } from "./pages/KnowledgeMap";
import { StudyMode } from "./pages/StudyMode";
import { Inspector } from "./components/Inspector";
import { UIProvider, useUI } from "./context/UIContext";
import { Toaster } from "react-hot-toast";

function AppContent() {
  const { inspectorOpen, inspectorContent, closeInspector } = useUI();

  return (
    <div className="flex flex-col-reverse sm:flex-row h-[100dvh] bg-ink text-parchment overflow-hidden">
      <Rail />

      <main className="flex-1 relative overflow-y-auto overflow-x-hidden scroll-smooth snap-y snap-mandatory">
        <section id="home" className="h-full w-full snap-start relative shrink-0">
          <Landing />
        </section>
        <section id="chat" className="h-full w-full snap-start relative shrink-0 border-t border-fog/10">
          <Chat />
        </section>
        <section id="library" className="h-full w-full snap-start relative shrink-0 border-t border-fog/10">
          <Library />
        </section>
        <section id="map" className="h-full w-full snap-start relative shrink-0 border-t border-fog/10">
          <KnowledgeMap />
        </section>
        <section id="study" className="h-full w-full snap-start relative shrink-0 border-t border-fog/10">
          <StudyMode />
        </section>
      </main>

      <Inspector
        isOpen={inspectorOpen}
        onClose={closeInspector}
        content={inspectorContent}
      />
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-indigo)',
            color: 'var(--color-parchment)',
            border: '1px solid rgba(192, 138, 62, 0.2)', // brass/20
            fontFamily: 'var(--font-ui)',
            fontSize: '14px'
          },
        }}
      />
    </div>
  );
}

import { ThemeProvider } from "./context/ThemeContext";

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
