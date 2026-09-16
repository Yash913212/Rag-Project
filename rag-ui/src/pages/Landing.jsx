import { useState, useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";


function Starfield() {
  const ref = useRef();
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

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
  const items = [
    "Ollama",
    "gpt-oss:20b-cloud",
    "ChromaDB",
    "FastAPI",
    "React 19",
    "Three.js",
    "Framer Motion",
    "Tailwind v4",
  ];
  return (
    <div className="w-full overflow-hidden whitespace-nowrap bg-indigo py-3 border-y border-fog/10">
      <div className="inline-block animate-[marquee_20s_linear_infinite] hover:[animation-play-state:paused]">
        {items
          .concat(items)
          .concat(items)
          .map((item, i) => (
            <span
              key={i}
              className="mx-8 font-data-mono text-fog uppercase text-xs tracking-wider"
            >
              {item}
            </span>
          ))}
      </div>
    </div>
  );
};

export function Landing() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { ease: [0.22, 1, 0.36, 1], duration: 0.6 },
    },
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col overflow-y-auto">
      <header className="p-8 flex justify-between items-center">
        <div className="font-hero text-xl text-brass">The Field Atlas</div>
        <button
          onClick={() => document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" })}
          className="px-4 py-2 bg-indigo rounded-lg font-ui-label text-parchment hover:bg-brass hover:text-ink transition-colors"
        >
          Open App
        </button>
      </header>

      <main className="flex-1 px-4 sm:px-8 lg:px-24 flex flex-col lg:flex-row items-center gap-8 sm:gap-16 relative">
        <motion.div
          className="w-full lg:w-[60%] z-10 space-y-8"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            variants={item}
            className="font-hero text-5xl sm:text-6xl lg:text-8xl max-w-[80ch] flex flex-wrap gap-x-2 sm:gap-x-4 gap-y-2"
          >
            {["Map", "your", "personal", "knowledge."].map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, rotateX: 90 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.15,
                  type: "spring",
                  damping: 12,
                }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p
            variants={item}
            className="font-body text-fog text-lg lg:text-xl max-w-[60ch]"
          >
            Upload documents, explore semantic connections in 3D, and retain
            what matters—fully local and private.
          </motion.p>
          <motion.div variants={item} className="flex flex-wrap gap-4">
            <button
              onClick={() => document.getElementById("library")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 bg-brass text-ink rounded-lg font-ui-label hover:bg-parchment transition-colors"
            >
              Start Mapping
            </button>
            <button
              onClick={() => document.getElementById("map")?.scrollIntoView({ behavior: "smooth" })}
              className="px-6 py-3 border border-fog/30 rounded-lg font-ui-label hover:border-parchment transition-colors"
            >
              Explore Map
            </button>
          </motion.div>

          <motion.div
            variants={item}
            className="pt-8 sm:pt-16 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 text-left pb-8 sm:pb-0"
          >
            {[
              { num: "01", title: "Upload", desc: "Add PDFs and Markdown to your local collection." },
              { num: "02", title: "Ask", desc: "Chat with your documents, backed by precise citations." },
              { num: "03", title: "Explore", desc: "Navigate a 3D atlas of your semantic embeddings." }
            ].map((step, i) => (
              <motion.div 
                key={step.num}
                whileHover={{ scale: 1.05, y: -5 }}
                className="p-6 rounded-xl bg-indigo/20 border border-fog/10 hover:border-brass/30 transition-colors cursor-default relative overflow-hidden group shadow-lg"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-brass/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-brass/20 transition-colors" />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  className="text-brass font-data-mono mb-4 text-xl"
                >
                  {step.num}
                </motion.div>
                <h3 className="font-h3 mb-2 text-parchment">{step.title}</h3>
                <p className="font-body text-fog text-sm relative z-10">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>


        <div className="w-full lg:w-[40%] h-[400px] lg:h-full lg:absolute right-0 top-0 opacity-60 lg:opacity-100 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 5] }} frameloop={isInView ? "always" : "demand"} dpr={[1, 1.5]}>
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
