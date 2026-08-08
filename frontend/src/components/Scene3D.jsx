import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";

const fibonacciSphere = (count, radius) => {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = radius * Math.cos(phi);
    arr[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }
  return arr;
};

const Globe = ({ mouse }) => {
  const group = useRef();
  const inner = useMemo(() => fibonacciSphere(900, 1), []);
  const outer = useMemo(() => fibonacciSphere(220, 1.45), []);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.07;
    group.current.rotation.x += (mouse[1] * 0.25 - group.current.rotation.x) * 0.04;
    group.current.rotation.z += (mouse[0] * 0.12 - group.current.rotation.z) * 0.04;
  });

  return (
    <group ref={group} position={[0.9, 0, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[inner, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.018} color="#6725EB" sizeAttenuation transparent opacity={0.75} />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outer, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#4CA743" sizeAttenuation transparent opacity={0.5} />
      </points>
      <mesh rotation={[Math.PI / 2.4, 0, 0.4]}>
        <torusGeometry args={[1.35, 0.0025, 8, 160]} />
        <meshBasicMaterial color="#0D0E0D" transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 1.7, 0.5, -0.3]}>
        <torusGeometry args={[1.6, 0.002, 8, 160]} />
        <meshBasicMaterial color="#6725EB" transparent opacity={0.22} />
      </mesh>
    </group>
  );
};

const Scene3D = ({ className = "" }) => {
  const [mouse, setMouse] = useState([0, 0]);
  useEffect(() => {
    const fn = (e) =>
      setMouse([(e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1]);
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  return (
    <div className={`pointer-events-none ${className}`} data-testid="hero-3d-scene" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} dpr={[1, 1.5]}>
        <Globe mouse={mouse} />
      </Canvas>
    </div>
  );
};

export default Scene3D;
