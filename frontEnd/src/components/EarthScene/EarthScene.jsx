import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { useRef, useMemo, useEffect } from 'react';
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
        const radius = 1.3;
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
            <Sphere ref={earthRef} args={[1.3, 64, 64]}>
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
            <Sphere args={[1.32, 64, 64]}>
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

    // Moon orbits at a realistic distance (scaled down)
    const moonDistance = 4.5;
    const angle = Math.PI / 4; // 45 degrees
    const yOffset = 0.3; // Moon's y-position offset

    return (
        <>
            <Sphere
                position={[
                    moonDistance * Math.cos(angle),
                    yOffset,
                    moonDistance * Math.sin(angle)
                ]}
                args={[0.26, 32, 32]}
            >
                <meshStandardMaterial
                    map={moonTexture}
                    roughness={0.9}
                    metalness={0.0}
                />
            </Sphere>
            {/* Moon orbital path aligned with Moon's position */}
            <mesh position={[0, yOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[moonDistance - 0.05, moonDistance + 0.05, 64]} />
                <meshBasicMaterial
                    color="#555555"
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </>
    );
}

function Sun() {
    const sunTexture = useLoader(THREE.TextureLoader, '/src/assets/textures/Sun/8k_sun.jpg'); // Sun position - placed to create day/night effect
    const sunDistance = 15;
    return (
        <Sphere position={[sunDistance, 2, 0]} args={[2, 32, 32]}>
            <meshStandardMaterial
                map={sunTexture}
                color="white" // don’t tint over the texture
                emissive="white"
                emissiveMap={sunTexture} // makes the texture itself emit light
                emissiveIntensity={1.5}
            />
        </Sphere>
    );
}

function AsteroidApproach({ show, params, targetLocation, onImpact }) {
    const asteroidRef = useRef();
    const rEarth = 1.3;

    const targetPosition = useMemo(() => {
        if (!targetLocation) return null;

        const { latitude, longitude } = targetLocation;
        const radius = rEarth;
        const phi = (90 - latitude) * (Math.PI / 180);
        const theta = (longitude + 180) * (Math.PI / 180);

        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);

        return new THREE.Vector3(x, y, z);
    }, [targetLocation]);

    const modelVel = useMemo(() => {
        if (!targetPosition || !show) return null;

        const phi = (90 - targetLocation.latitude) * (Math.PI / 180);
        const theta = (targetLocation.longitude + 180) * (Math.PI / 180);

        const radialUnit = targetPosition.clone().normalize();
        const unitEast = new THREE.Vector3(Math.sin(theta), 0, Math.cos(theta));
        const unitNorth = new THREE.Vector3(
            Math.cos(phi) * Math.cos(theta),
            Math.sin(phi),
            -Math.cos(phi) * Math.sin(theta)
        );

        const velVector = new THREE.Vector3();
        velVector.addScaledVector(unitEast, params.horizontal_velocity_km_s);
        velVector.addScaledVector(unitNorth, params.vertical_velocity_km_s);
        velVector.addScaledVector(radialUnit, -params.z_velocity_km_s); // inward

        const speed = velVector.length();
        if (speed === 0) return null;

        const direction = velVector.clone().normalize();

        const scale = rEarth / 6371; // units per km
        const realDistanceKm = params.distance * 1000;
        let modelDistance = realDistanceKm * scale;
        const maxModelDistance = 20; // Cap to prevent invisibly far starts
        modelDistance = Math.min(modelDistance, maxModelDistance);

        // Animation time (in seconds) - adjusted by simulation_speed
        const baseTime = 5; // base 5 seconds at simulation_speed=50
        const animationTime = params.simulation_speed > 0 ? baseTime * (50 / params.simulation_speed) : Infinity;

        const velMag = modelDistance / animationTime;

        return direction.multiplyScalar(velMag);
    }, [show, params, targetLocation]);

    const initialPosition = useMemo(() => {
        if (!targetPosition || !modelVel) return new THREE.Vector3(2, 0.5, 2);

        const direction = modelVel.clone().normalize();
        const scale = rEarth / 6371;
        const realDistanceKm = params.distance * 1000;
        let modelDistance = realDistanceKm * scale;
        const maxModelDistance = 20;
        modelDistance = Math.min(modelDistance, maxModelDistance);

        return targetPosition.clone().sub(direction.clone().multiplyScalar(modelDistance));
    }, [modelVel, targetPosition, params]);

    useEffect(() => {
        if (show && asteroidRef.current) {
            asteroidRef.current.position.copy(initialPosition);
        }
    }, [show, initialPosition]);

    useFrame((state, delta) => {
        if (show && asteroidRef.current && modelVel && params.simulation_speed > 0) {
            asteroidRef.current.position.add(modelVel.clone().multiplyScalar(delta));

            // Check for impact
            if (asteroidRef.current.position.length() < rEarth + 0.1) {
                onImpact();
            }
        }
    });

    // Enhanced size scaling: minimum size for visibility, scales with diameter
    const baseSize = 0.05; // Minimum size for small asteroids
    const scaleFactor = 0.03; // Scaling per km for better visual range
    const asteroidSize = Math.max(baseSize, params.diameter_km * scaleFactor);

    if (!show) return null;

    return (
        <>
            <Sphere ref={asteroidRef} args={[asteroidSize, 16, 16]} position={initialPosition}>
                <meshStandardMaterial
                    color="#888888"
                    roughness={0.9}
                    emissive="#ff5555" // Subtle red glow for visibility
                    emissiveIntensity={0.3}
                />
            </Sphere>
            {/* Optional label for the asteroid */}
            <Html position={initialPosition} distanceFactor={2}>
                <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                    Asteroid ({params.diameter_km} km)
                </div>
            </Html>
        </>
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
                    position={[15, 2, 0]}
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

                {/* Asteroid */}
                <AsteroidApproach show={showAsteroid} params={params} targetLocation={targetLocation} onImpact={onImpact} />

                {/* Controls */}
                <OrbitControls
                    enablePan={false}
                    minDistance={2}
                    maxDistance={30} // Increased to allow viewing farther asteroids
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