import { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';

function Flashcard({ card, onSwipe }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (e, info) => {
    if (info.offset.x > 100) {
      onSwipe('right');
      setIsFlipped(false);
    } else if (info.offset.x < -100) {
      onSwipe('left');
      setIsFlipped(false);
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity, perspective: 1000 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="w-full max-w-sm h-80 cursor-grab active:cursor-grabbing mx-auto relative"
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full h-full relative preserve-3d"
        style={{ transformStyle: 'preserve-3d' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div className="absolute inset-0 bg-parchment text-ink p-8 rounded-xl flex flex-col items-center justify-center text-center backface-hidden shadow-xl border border-brass/20">
          <div className="font-ui-label text-fog uppercase tracking-widest text-xs mb-auto">Question</div>
          <div className="font-hero text-xl">{card.front}</div>
          <div className="mt-auto font-data-mono text-fog text-[10px]">Tap to flip</div>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 bg-indigo text-parchment p-8 rounded-xl flex flex-col items-center justify-center text-center backface-hidden shadow-xl border border-brass/20"
          style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
        >
          <div className="font-ui-label text-brass uppercase tracking-widest text-xs mb-auto">Answer</div>
          <div className="font-body overflow-y-auto w-full">{card.back}</div>
          {card.source && (
            <div className="font-body text-xs text-fog/50 mt-4 line-clamp-2">"{card.source}"</div>
          )}
          <div className="mt-auto flex justify-between w-full font-data-mono text-fog text-[10px] pt-4">
            <span>← Needs work</span>
            <span>Got it →</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProgressDial({ current, total }) {
  const percentage = (current / total) * 100;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg className="transform -rotate-90 w-16 h-16">
        <circle
          cx="32"
          cy="32"
          r={radius}
          className="stroke-fog/20"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          className="stroke-brass transition-all duration-500 ease-in-out"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="absolute font-data-mono text-parchment text-xs">
        {current}/{total}
      </div>
    </div>
  );
}

export function StudyMode() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isStudying, setIsStudying] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch(`${API_BASE}/documents`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(data);
          if (data.length > 0) setSelectedDoc(data[0].name);
        }
      } catch (e) {
        console.error("Failed to fetch documents", e);
      }
    };
    fetchDocs();
  }, []);

  const generateDeck = async () => {
    if (!selectedDoc) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document: selectedDoc, count: 5, kind: 'flashcards' })
      });
      if (res.ok) {
        const data = await res.json();
        setCards(data.map((c, i) => ({ ...c, id: i })));
        setCurrentIndex(0);
        setIsStudying(true);
      }
    } catch (e) {
      console.error("Failed to generate quiz", e);
      alert("Failed to generate flashcards.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = (direction) => {
    setCurrentIndex(prev => Math.min(prev + 1, cards.length));
  };

  if (!isStudying) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 max-w-lg mx-auto">
        <h1 className="font-hero text-4xl text-brass mb-4 text-center">Study Mode</h1>
        <p className="font-body text-fog mb-12 text-center">Generate a flashcard deck directly from the semantic embeddings of any local document.</p>
        
        <div className="w-full bg-indigo/30 p-6 rounded-xl border border-fog/20 flex flex-col gap-4">
          <label className="font-ui-label text-parchment uppercase tracking-widest text-xs">Target Document</label>
          <select 
            value={selectedDoc} 
            onChange={(e) => setSelectedDoc(e.target.value)}
            className="w-full bg-ink border border-fog/20 rounded-lg p-3 font-body text-parchment focus:outline-none focus:border-brass"
          >
            {documents.length === 0 && <option value="">No documents available</option>}
            {documents.map(d => (
              <option key={d.name} value={d.name}>{d.name}</option>
            ))}
          </select>
          
          <button
            onClick={generateDeck}
            disabled={!selectedDoc || isLoading}
            className="w-full mt-4 py-3 bg-brass text-ink rounded-lg font-ui-label hover:bg-parchment transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <span className="animate-pulse">Generating deck...</span> : 'Generate Deck'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8">
      <header className="mb-12 flex justify-between items-center">
        <div>
          <h1 className="font-hero text-4xl text-brass mb-2">Study Mode</h1>
          <p className="font-body text-fog">Reviewing: {selectedDoc}</p>
        </div>
        <ProgressDial current={currentIndex} total={cards.length} />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="popLayout">
          {currentIndex < cards.length ? (
            <motion.div
              key={cards[currentIndex].id}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="w-full"
            >
              <Flashcard card={cards[currentIndex]} onSwipe={handleSwipe} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="font-hero text-3xl text-brass mb-4">Deck complete</div>
              <p className="font-body text-fog mb-8">You've reviewed all cards in this session.</p>
              <button 
                onClick={() => setIsStudying(false)}
                className="px-6 py-3 bg-indigo text-parchment rounded-lg font-ui-label hover:bg-brass hover:text-ink transition-colors"
              >
                Study Another Document
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
