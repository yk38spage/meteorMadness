import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

function Earth({ impactPoint, blastRadius }) {
    const earthRef = useRef();

    // Load Earth textures
    const [dayMap, nightMap, normalMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
        '/src/assets/textures/Earth/8k_earth_daymap.jpg',
        '/src/assets/textures/Earth/8k_earth_nightmap.jpg',
        '/src/assets/textures/Earth/8k_earth_normal_map.jpg',
        '/src/assets/textures/Earth/8k_earth_specular_map.jpg',
        '/src/assets/textures/Earth/8k_earth_clouds.jpg',
    ]);

    // Convert lat/lon to 3D coordinates on sphere
    const impactPosition = useMemo(() => {
        if (!impactPoint) return null;

        const { latitude, longitude } = impactPoint;
        const radius = 1; // Earth's radius scaled to 1
        const phi = (90 - latitude) * (Math.PI / 180);
        const theta = (longitude + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);

        return [x, y, z];
    }, [impactPoint]);

    return (
        <>
            {/* Earth with day/night textures */}
            <Sphere ref={earthRef} args={[1, 64, 64]}>
                <meshStandardMaterial
                    map={dayMap}
                    normalMap={normalMap}
                    roughnessMap={specularMap}
                    roughness={0.7}
                    metalness={0.1}
                    emissiveMap={nightMap}
                    emissive={new THREE.Color(0xffff88)}
                    emissiveIntensity={1.2}
                />
            </Sphere>

            {/* Cloud layer */}
            <Sphere args={[1.02, 64, 64]}>
                <meshStandardMaterial
                    map={cloudsMap}
                    transparent
                    opacity={0.4}
                    depthWrite={false}
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

function Moon() {
    const moonTexture = useLoader(THREE.TextureLoader, '/src/assets/textures/Moon/8k_moon.jpg');

    // Moon scaled to real proportions (radius = 0.2725 * Earth radius)
    // Distance scaled down by 1/1000 for visualization (real: ~60.3 units)
    const moonDistance = 0.0603; // 384,400 km / 6,371 km / 1000
    const angle = Math.PI / 4; // 45 degrees for orbit position

    return (
        <Sphere
            position={[
                moonDistance * Math.cos(angle),
                0.3,
                moonDistance * Math.sin(angle)
            ]}
            args={[0.2725, 32, 32]}
        >
            <meshStandardMaterial
                map={moonTexture}
                roughness={0.9}
                metalness={0.0}
            />
        </Sphere>
    );
}

function Sun() {
    // Load Sun texture
    const sunTexture = useLoader(THREE.TextureLoader, '/src/assets/textures/Sun/8k_sun.jpg');

    // Sun scaled to real proportions (radius = 109.2 * Earth radius)
    // Distance scaled down by 1/1000 for visualization (real: ~23,450 units)
    const sunDistance = 23.45; // 149,600,000 km / 6,371 km / 1000

    return (
        <>
            <Sphere position={[sunDistance, 2, 0]} args={[0.1092, 32, 32]}>
                <meshStandardMaterial
                    map={sunTexture}
                    emissive="#FDB813"
                    emissiveIntensity={1}
                    roughness={0.5}
                    metalness={0.0}
                />
            </Sphere>

            {/* Lens flare effect */}
            <pointLight
                position={[sunDistance, 2, 0]}
                intensity={2.5}
                color="#ffffff"
                distance={50}
            />
        </>
    );
}

export default function EarthScene({ impactPoint, blastRadius }) {
    return (
        <div className="w-full h-full bg-black">
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                {/* Ambient light - lower intensity for space realism */}
                <ambientLight intensity={0.15} />

                {/* Sun directional light - simulates sunlight */}
                <directionalLight
                    position={[23.45, 2, 0]} // Match Sun's scaled position
                    intensity={2.0}
                    color="#ffffff"
                />

                {/* Fill light from opposite side - subtle */}
                <pointLight position={[-10, 0, -5]} intensity={0.2} color="#4466ff" />

                {/* Sun */}
                <Sun />

                {/* Earth and impact */}
                <Earth impactPoint={impactPoint} blastRadius={blastRadius} />

                {/* Moon */}
                <Moon />

                {/* Controls */}
                <OrbitControls
                    enablePan={false}
                    minDistance={2}
                    maxDistance={8}
                    autoRotate
                    autoRotateSpeed={0.3}
                />

                {/* Stars background */}
                <mesh>
                    <sphereGeometry args={[100, 32, 32]} />
                    <meshBasicMaterial color="#000011" side={THREE.BackSide} />
                </mesh>
            </Canvas>
        </div>
    );
}