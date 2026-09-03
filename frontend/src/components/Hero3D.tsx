import { Suspense, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber';
import { Environment, Float, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
const PARTICLE_COUNT = isMobile ? 220 : 800;

/** Gentle drifting gold dust that fills the depth of the scene. */
function Particles() {
  const points = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 18;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.015;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#C9A15A"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

/** A single floating architectural monolith — evokes a minimalist hotel facade panel. */
function ArchPanel({
  position,
  scale = 1,
  speed = 1,
  ...rest
}: {
  position: [number, number, number];
  scale?: number;
  speed?: number;
} & ThreeElements['mesh']) {
  return (
    <Float speed={speed} rotationIntensity={0.25} floatIntensity={0.6}>
      <mesh position={position} scale={scale} castShadow receiveShadow {...rest}>
        <boxGeometry args={[1, 2.4, 0.08]} />
        <meshStandardMaterial
          color="#151A21"
          metalness={0.6}
          roughness={0.25}
          emissive="#C9A15A"
          emissiveIntensity={0.03}
        />
      </mesh>
    </Float>
  );
}

function ArchColumn({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={0.6} rotationIntensity={0.1} floatIntensity={0.4}>
      <mesh position={position}>
        <cylinderGeometry args={[0.05, 0.05, 3, 16]} />
        <meshStandardMaterial color="#C9A15A" metalness={0.9} roughness={0.15} />
      </mesh>
    </Float>
  );
}

/** Camera rig that responds to pointer movement with a spring-like ease. */
function CursorRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    target.current.x = (state.pointer.x * Math.PI) / 40;
    target.current.y = (state.pointer.y * Math.PI) / 60;
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(
        group.current.rotation.y,
        target.current.x,
        0.04
      );
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        -target.current.y,
        0.04
      );
    }
  });

  return <group ref={group}>{children}</group>;
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.5, 7]} fov={45} />
      <fog attach="fog" args={['#0B0E12', 6, 16]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 4]} intensity={0.8} color="#F4EFE6" />
      <pointLight position={[-4, -2, -2]} intensity={0.4} color="#C9A15A" />

      <CursorRig>
        <ArchPanel position={[-2.1, 0.3, -1]} scale={1.1} speed={0.8} />
        <ArchPanel position={[2.3, -0.4, -2]} scale={0.9} speed={1.1} />
        <ArchPanel position={[0.4, 1.1, -3]} scale={0.7} speed={0.9} />
        <ArchColumn position={[-3.2, -0.2, -3.5]} />
        <ArchColumn position={[3.4, 0.4, -4]} />
        <Particles />
      </CursorRig>

      <Environment preset="city" />
    </>
  );
}

/** Static fallback shown if WebGL context creation fails, so the page never crashes. */
function FallbackHero() {
  return (
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(11,14,18,0.4), rgba(11,14,18,0.95)), url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80')",
      }}
      role="img"
      aria-label="Luxury hotel exterior at dusk"
    />
  );
}

export default function Hero3D() {
  const [webglFailed, setWebglFailed] = useState(false);

  const handleError = useCallback(() => setWebglFailed(true), []);

  if (webglFailed) {
    return <FallbackHero />;
  }

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', handleError, {
            once: true,
          });
        }}
        onError={handleError}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
