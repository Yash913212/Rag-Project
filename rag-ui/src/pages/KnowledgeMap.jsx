import { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config';
import { useUI } from '../context/UIContext';

const CLUSTER_COLORS = [
  '#C08A3E', // Brass
  '#4C7A63', // Moss
  '#B0503A', // Rust
  '#9CA6B8', // Fog
  '#E8E1D0', // Parchment
];

function InstancedPoints({ data, activeClusters, onHover, onClick }) {
  const meshRef = useRef();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    if (!meshRef.current || data.length === 0) return;
    
    data.forEach((point, i) => {
      dummy.position.set(point.x, point.y, point.z);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      const isActive = activeClusters.has(point.cluster);
      const hex = CLUSTER_COLORS[point.cluster % CLUSTER_COLORS.length];
      color.set(hex);
      
      if (!isActive) {
        color.lerp(new THREE.Color('#10141C'), 0.8);
      }
      
      meshRef.current.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    meshRef.current.instanceColor.needsUpdate = true;
  }, [data, activeClusters, dummy, color]);

  const handlePointerMove = (e) => {
    if (e.instanceId !== undefined) {
      e.stopPropagation();
      onHover(data[e.instanceId]);
    }
  };

  const handlePointerOut = () => {
    onHover(null);
  };

  const handleClick = (e) => {
    if (e.instanceId !== undefined) {
      e.stopPropagation();
      onClick(data[e.instanceId]);
    }
  };

  if (data.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, data.length]}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      <sphereGeometry args={[0.08, 16, 16]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function Scene({ data, activeClusters, setTooltipData, onPointClick }) {
  const controlsRef = useRef();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [isInteracting, setIsInteracting] = useState(false);
  const idleTimeout = useRef(null);

  const handleInteraction = () => {
    setIsInteracting(true);
    if (idleTimeout.current) clearTimeout(idleTimeout.current);
    idleTimeout.current = setTimeout(() => {
      setIsInteracting(false);
    }, 3000);
  };

  return (
    <>
      <OrbitControls 
        ref={controlsRef}
        autoRotate={!prefersReducedMotion && !isInteracting}
        autoRotateSpeed={0.5}
        onStart={handleInteraction}
        onChange={handleInteraction}
        enableDamping
        dampingFactor={0.05}
      />
      <InstancedPoints 
        data={data} 
        activeClusters={activeClusters}
        onHover={setTooltipData}
        onClick={onPointClick}
      />
    </>
  );
}

export function KnowledgeMap() {
  const [data, setData] = useState({ points: [], clusters: [] });
  const [activeClusters, setActiveClusters] = useState(new Set());
  const [tooltipData, setTooltipData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { openInspector } = useUI();

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await fetch(`${API_BASE}/map`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setActiveClusters(new Set(json.clusters.map(c => c.id)));
        }
      } catch (e) {
        console.error("Failed to load map data", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMap();
  }, []);

  const toggleCluster = (cluster) => {
    const next = new Set(activeClusters);
    if (next.has(cluster)) {
      next.delete(cluster);
    } else {
      next.add(cluster);
    }
    setActiveClusters(next);
  };

  const handlePointClick = (point) => {
    openInspector(`**${point.source}**\n\n${point.text}`);
  };

  return (
    <div className="h-full w-full relative bg-ink">
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h2 className="font-hero text-3xl mb-2">Knowledge Map</h2>
        <p className="font-body text-fog text-sm">
          {isLoading ? "Analyzing knowledge base..." : `${data.points.length.toLocaleString()} chunks`}
        </p>
      </div>

      {!isLoading && data.clusters.length > 0 && (
        <div className="absolute bottom-8 left-8 z-10 bg-indigo/50 p-4 rounded-xl border border-fog/20 backdrop-blur-md max-w-xs">
          <div className="font-ui-label text-fog mb-3 uppercase tracking-wide text-xs">Clusters</div>
          <div className="flex flex-col gap-2">
            {data.clusters.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCluster(c.id)}
                className={`flex items-center gap-3 transition-opacity ${
                  activeClusters.has(c.id) ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div 
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: CLUSTER_COLORS[c.id % CLUSTER_COLORS.length] }}
                />
                <span className="font-body text-sm text-left truncate text-parchment">{c.label}</span>
                <span className="font-data-mono text-xs text-fog ml-auto">{c.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {tooltipData && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-8 right-8 z-10 bg-indigo/90 p-4 rounded-xl border border-fog/20 backdrop-blur-md max-w-sm pointer-events-none"
          >
            <div className="font-data-mono text-fog text-[10px] mb-2 uppercase">
              PCA: [{tooltipData.x.toFixed(3)}, {tooltipData.y.toFixed(3)}, {tooltipData.z.toFixed(3)}]
            </div>
            <div className="font-ui-label text-brass mb-1">{tooltipData.source}</div>
            <div className="font-body text-sm line-clamp-3 leading-snug">
              "{tooltipData.text}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center font-data-mono text-fog">
          <div className="animate-pulse">Calibrating instruments...</div>
          <div className="text-xs opacity-60">The AI is generating cluster summaries (this may take ~15-20 seconds).</div>
        </div>
      ) : (
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center font-data-mono text-fog">
            Rendering map...
          </div>
        }>
          <Canvas camera={{ position: [0, 0, 30] }}>
            <Scene 
              data={data.points} 
              activeClusters={activeClusters} 
              setTooltipData={setTooltipData} 
              onPointClick={handlePointClick}
            />
          </Canvas>
        </Suspense>
      )}
    </div>
  );
}
