import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

function RingCluster() {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.05;
  });

  const rings = useMemo(() => [1.6, 1.2, 0.8], []);

  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <Float key={r} speed={0.8 + i * 0.2} floatIntensity={0.5} rotationIntensity={0.3}>
          <mesh rotation={[Math.PI / 2.4, 0, i * 0.6]}>
            <torusGeometry args={[r, 0.015, 16, 100]} />
            <meshStandardMaterial color="#C9A15A" metalness={0.9} roughness={0.1} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

export default function Experience3D() {
  return (
    <section className="relative overflow-hidden py-24" aria-labelledby="experience-heading">
      <div className="container grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="text-xs uppercase tracking-[0.3em] text-primary">The Lumora standard</span>
          <h2 id="experience-heading" className="mt-3 font-display text-3xl text-foreground md:text-4xl">
            Every detail, considered.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            From the weight of the door handle to the temperature of the pool, our properties are chosen
            for the moments guests remember without trying to.
          </p>
        </motion.div>

        <div className="relative h-72 md:h-96">
          <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
            <Suspense fallback={null}>
              <ambientLight intensity={0.4} />
              <directionalLight position={[3, 4, 5]} intensity={0.7} />
              <RingCluster />
              <Environment preset="studio" />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </section>
  );
}
