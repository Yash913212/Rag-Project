import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';
import { useTheme } from '../context/theme';

const PARTICLE_COUNT = 900;

const PARTICLE_POSITIONS = (() => {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const r = 2.2 * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  return positions;
})();

const ACCENT_FLAGS = Array.from({ length: PARTICLE_COUNT }, () => Math.random() < 0.28);

const FLOATING_NODES = [
  { position: [-4.5, 1.5, -3], scale: 0.22 },
  { position: [4.8, -1, -2], scale: 0.18 },
  { position: [-3, -2.5, -4], scale: 0.14 },
  { position: [3.5, 2.5, -3.5], scale: 0.16 },
];

function ParticleSphere({ accent, muted, particleOpacity }) {
  const points = useRef();
  const reduced = useReducedMotion();

  const colors = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      color.set(ACCENT_FLAGS[i] ? accent : muted);
      arr[i * 3] = color.r;
      arr[i * 3 + 1] = color.g;
      arr[i * 3 + 2] = color.b;
    }
    return arr;
  }, [accent, muted]);

  useFrame((state) => {
    if (!reduced && points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.04;
      points.current.rotation.x = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_POSITIONS.length / 3}
          array={PARTICLE_POSITIONS}
          itemSize={3}
        />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.028} vertexColors transparent opacity={particleOpacity} sizeAttenuation />
    </points>
  );
}

function FloatingNodes({ wireColor, opacity }) {
  return (
    <>
      {FLOATING_NODES.map((node, i) => (
        <Float key={i} speed={1.2} rotationIntensity={0.8} floatIntensity={1.5}>
          <Sphere position={node.position} scale={node.scale}>
            <meshStandardMaterial
              color={wireColor}
              emissive={wireColor}
              emissiveIntensity={0.35}
              transparent
              opacity={opacity}
              wireframe
            />
          </Sphere>
        </Float>
      ))}
    </>
  );
}

export default function ThreeHero() {
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const isLight = theme === 'light';

  const accent = isLight ? '#c47820' : '#f2b84b';
  const muted = isLight ? '#c8cdd0' : '#3a4a52';
  const wireColor = isLight ? '#d88a2c' : '#ffd27a';

  return (
    <div
      className="hero-canvas absolute inset-0 z-[1] pointer-events-none"
      aria-hidden
    >
      <Canvas camera={{ position: [0, 0, 8], fov: 42 }} powerPreference="low-power" frameloop={reduced ? 'demand' : 'always'}>
        <ambientLight intensity={isLight ? 0.85 : 0.5} />
        <pointLight position={[8, 6, 10]} intensity={isLight ? 0.6 : 1} color={accent} />
        <ParticleSphere accent={accent} muted={muted} particleOpacity={isLight ? 0.45 : 0.75} />
        <FloatingNodes wireColor={wireColor} opacity={isLight ? 0.22 : 0.38} />
      </Canvas>
    </div>
  );
}
