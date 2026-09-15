import { motion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import { useState, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

function Starfield() {
  const ref = useRef();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const [positions] = useState(() => {
    const count = 500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  });

  useFrame((state, delta) => {
    if (!prefersReducedMotion && ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#C08A3E"
          size={0.05}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

const Marquee = () => {
  const items = ["Ollama", "gpt-oss:20b-cloud", "ChromaDB", "FastAPI", "React 19", "Three.js", "Framer Motion", "Tailwind v4"];
  return (
    <div className="w-full overflow-hidden whitespace-nowrap bg-indigo py-3 border-y border-fog/10">
      <div className="inline-block animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused]">
        {items.concat(items).concat(items).map((item, i) => (
          <span key={i} className="mx-8 font-data-mono text-fog uppercase text-xs tracking-wider">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export function Landing() {
  const navigate = useNavigate();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.6 } }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <header className="p-8 flex justify-between items-center">
        <div className="font-hero text-xl text-brass">The Field Atlas</div>
        <button 
          onClick={() => navigate('/chat')}
          className="px-4 py-2 bg-indigo rounded-lg font-ui-label text-parchment hover:bg-brass hover:text-ink transition-colors"
        >
          Open App
        </button>
      </header>

      <main className="flex-1 px-8 lg:px-24 flex flex-col lg:flex-row items-center gap-16 relative">
        <motion.div 
          className="w-full lg:w-[60%] z-10 space-y-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.h1 variants={item} className="font-hero text-5xl lg:text-7xl max-w-[80ch]">
            Map your personal knowledge.
          </motion.h1>
          <motion.p variants={item} className="font-body text-fog text-lg lg:text-xl max-w-[60ch]">
            Upload documents, explore semantic connections in 3D, and retain what matters—fully local and private.
          </motion.p>
          <motion.div variants={item} className="flex gap-4">
            <button 
              onClick={() => navigate('/library')}
              className="px-6 py-3 bg-brass text-ink rounded-lg font-ui-label hover:bg-parchment transition-colors"
            >
              Start Mapping
            </button>
            <button 
              onClick={() => navigate('/map')}
              className="px-6 py-3 border border-fog/30 rounded-lg font-ui-label hover:border-parchment transition-colors"
            >
              Explore Map
            </button>
          </motion.div>
          
          <motion.div variants={item} className="pt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div>
              <div className="text-brass font-data-mono mb-2">01</div>
              <h3 className="font-h3 mb-2">Upload</h3>
              <p className="font-body text-fog text-sm">Add PDFs and Markdown to your local collection.</p>
            </div>
            <div>
              <div className="text-brass font-data-mono mb-2">02</div>
              <h3 className="font-h3 mb-2">Ask</h3>
              <p className="font-body text-fog text-sm">Chat with your documents, backed by precise citations.</p>
            </div>
            <div>
              <div className="text-brass font-data-mono mb-2">03</div>
              <h3 className="font-h3 mb-2">Explore</h3>
              <p className="font-body text-fog text-sm">Navigate a 3D atlas of your semantic embeddings.</p>
            </div>
          </motion.div>
        </motion.div>

        <div className="w-full lg:w-[40%] h-[400px] lg:h-full lg:absolute right-0 top-0 opacity-60 lg:opacity-100 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <Starfield />
          </Canvas>
        </div>
      </main>

      <footer className="mt-auto">
        <Marquee />
      </footer>
    </div>
  );
}
