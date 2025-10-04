import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function Earth({ impactPoint, blastRadius }) {
    const earthRef = useRef();

    // Convert lat/lon to 3D coordinates on sphere
    const impactPosition = useMemo(() => {
        if (!impactPoint) return null;

        const { latitude, longitude } = impactPoint;
        const radius = 1;
        const phi = (90 - latitude) * (Math.PI / 180);
        const theta = (longitude + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);

        return [x, y, z];
    }, [impactPoint]);

    return (
        <>
            {/* Earth */}
            <Sphere ref={earthRef} args={[1, 64, 64]}>
                <meshStandardMaterial
                    color="#2b5a9e"
                    roughness={0.7}
                    metalness={0.2}
                />
            </Sphere>

            {/* Impact marker */}
            {impactPosition && (
                <>
                    <Sphere position={impactPosition} args={[0.03, 16, 16]}>
                        <meshBasicMaterial color="#ff0000" />
                    </Sphere>

                    {/* Blast radius circle */}
                    {blastRadius && (
                        <mesh position={impactPosition} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0, blastRadius / 6371, 32]} />
                            <meshBasicMaterial
                                color="#ff6600"
                                transparent
                                opacity={0.4}
                                side={THREE.DoubleSide}
                            />
                        </mesh>
                    )}

                    <Html position={impactPosition} distanceFactor={2}>
                        <div className="bg-red-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                            Impact Zone
                        </div>
                    </Html>
                </>
            )}
        </>
    );
}

function AsteroidApproach({ show }) {
    if (!show) return null;

    return (
        <Sphere position={[2, 0.5, 2]} args={[0.05, 16, 16]}>
            <meshBasicMaterial color="#888888" />
        </Sphere>
    );
}

export default function EarthScene({ impactPoint, blastRadius, showAsteroid }) {
    return (
        <div className="w-full h-full bg-black">
            <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />

                {/* Earth and impact */}
                <Earth impactPoint={impactPoint} blastRadius={blastRadius} />

                {/* Asteroid */}
                <AsteroidApproach show={showAsteroid} />

                {/* Controls */}
                <OrbitControls
                    enablePan={false}
                    minDistance={1.5}
                    maxDistance={5}
                    autoRotate
                    autoRotateSpeed={0.5}
                />

                {/* Stars background */}
                <mesh>
                    <sphereGeometry args={[50, 32, 32]} />
                    <meshBasicMaterial color="#000000" side={THREE.BackSide} />
                </mesh>
            </Canvas>
        </div>
    );
}
