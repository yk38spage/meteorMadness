import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

function Earth() {
    const earthRef = useRef();

    // Load Earth textures
    const [dayMap, nightMap, normalMap, specularMap, cloudsMap] = useLoader(THREE.TextureLoader, [
        '/src/assets/textures/Earth/8k_earth_daymap.jpg',
        '/src/assets/textures/Earth/8k_earth_nightmap.jpg',
        '/src/assets/textures/Earth/8k_earth_normal_map.jpg',
        '/src/assets/textures/Earth/8k_earth_specular_map.jpg',
        '/src/assets/textures/Earth/8k_earth_clouds.jpg',
    ]);

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

function Asteroid({ params }) {
    const asteroidRef = useRef();
    const EARTH_RADIUS_KM = 6371;

    // Calculate asteroid radius in scene units (Earth radius = 1 unit)
    const asteroidRadius = (params.diameter_km / 2) / EARTH_RADIUS_KM;

    // Calculate initial position based on latitude, longitude, and distance
    const altitudeKm = params.distance * 1000; // Distance is x1,000 km
    const radialDistance = 1 + (altitudeKm / EARTH_RADIUS_KM); // From Earth's center in units

    const lat = params.latitude;
    const lon = params.longitude;

    // Convert lat/lon to spherical coordinates
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = lon * (Math.PI / 180);

    const x = radialDistance * Math.sin(phi) * Math.cos(theta);
    const y = radialDistance * Math.cos(phi);
    const z = radialDistance * Math.sin(phi) * Math.sin(theta);

    // Update position if params change (React will re-render, but useEffect ensures ref update)
    useEffect(() => {
        if (asteroidRef.current) {
            asteroidRef.current.position.set(x, y, z);
        }
    }, [params, x, y, z]); // Depend on params and calculated position

    return (
        <Sphere ref={asteroidRef} args={[asteroidRadius, 32, 32]}>
            <meshBasicMaterial color="white" />
        </Sphere>
    );
}

export default function EarthScene({ impactPoint, blastRadius, showAsteroid, params, targetLocation, onImpact }) {
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

                {/* Earth */}
                <Earth />

                {/* Moon */}
                <Moon />

                {/* Asteroid (visible only when showAsteroid is true, updates with param changes) */}
                {showAsteroid && <Asteroid params={params} />}

                {/* Controls */}
                <OrbitControls
                    enablePan={false}
                    minDistance={0.5}
                    // maxDistance={8}
                    // autoRotate
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