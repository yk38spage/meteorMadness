import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Html } from '@react-three/drei';
import { useRef, useMemo, useEffect, useState } from 'react';
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
        const radius = 1; // Earth radius in model units
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
    const moonRef = useRef();
    const moonTexture = useLoader(THREE.TextureLoader, '/src/assets/textures/Moon/8k_moon.jpg');

    const moonDistance = 4.5;
    const yOffset = 0.3;

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime();
        const angle = time * 0.1;
        moonRef.current.position.set(
            moonDistance * Math.cos(angle),
            yOffset,
            moonDistance * Math.sin(angle)
        );
    });

    return (
        <>
            <Sphere
                ref={moonRef}
                position={[moonDistance, yOffset, 0]}
                args={[0.26, 32, 32]}
            >
                <meshStandardMaterial
                    map={moonTexture}
                    roughness={0.9}
                    metalness={0.0}
                />
            </Sphere>
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
    const sunTexture = useLoader(THREE.TextureLoader, '/src/assets/textures/Sun/8k_sun.jpg');
    const sunDistance = 15;
    return (
        <Sphere position={[sunDistance, 2, 0]} args={[2, 32, 32]}>
            <meshStandardMaterial
                map={sunTexture}
                color="white"
                emissive="white"
                emissiveMap={sunTexture}
                emissiveIntensity={1.5}
            />
        </Sphere>
    );
}

function AsteroidApproach({ show, params, initialLocation, onImpact }) {
    const asteroidRef = useRef();
    const rEarth = 1; // Model Earth radius

    // Real-world constants
    const G = 6.67430e-11; // m^3 kg^-1 s^-2
    const M = 5.972e24; // kg
    const R_EARTH_REAL = 6.371e6; // m

    // Gravity acceleration function
    const gravityAcceleration = (pos) => {
        const r = pos.length();
        if (r === 0) return new THREE.Vector3(0, 0, 0);
        const a_mag = -G * M / (r ** 2);
        return pos.clone().multiplyScalar(a_mag / r);
    };

    // RK4 integration step
    const rk4Step = (pos, vel, dt) => {
        const acc = gravityAcceleration;

        const k1_v = acc(pos);
        const k1_p = vel;

        const half_dt = 0.5 * dt;
        const k2_v = acc(pos.clone().addScaledVector(k1_p, half_dt));
        const k2_p = vel.clone().addScaledVector(k1_v, half_dt);

        const k3_v = acc(pos.clone().addScaledVector(k2_p, half_dt));
        const k3_p = vel.clone().addScaledVector(k2_v, half_dt);

        const k4_v = acc(pos.clone().addScaledVector(k3_p, dt));
        const k4_p = vel.clone().addScaledVector(k3_v, dt);

        const dt6 = dt / 6;
        const vel_new = vel.clone().add(
            k1_v.clone().multiplyScalar(dt6)
                .add(k2_v.clone().multiplyScalar(2 * dt6))
                .add(k3_v.clone().multiplyScalar(2 * dt6))
                .add(k4_v.clone().multiplyScalar(dt6))
        );
        const pos_new = pos.clone().add(
            k1_p.clone().multiplyScalar(dt6)
                .add(k2_p.clone().multiplyScalar(2 * dt6))
                .add(k3_p.clone().multiplyScalar(2 * dt6))
                .add(k4_p.clone().multiplyScalar(dt6))
        );

        return [pos_new, vel_new];
    };

    // Simulate trajectory
    const simulate = (position0, velocity0, dt = 0.5, max_steps = 50000) => {
        let pos = position0.clone();
        let vel = velocity0.clone();

        const positions = [];
        let crashed = false;
        let step = 0;
        let impactData = null;

        while (step < max_steps) {
            positions.push(pos.clone());

            const r = pos.length();

            // Check for Earth collision
            if (r <= R_EARTH_REAL) {
                crashed = true;

                // Calculate impact location (lat/lon)
                const normalized = pos.clone().normalize();
                const latitude = Math.asin(normalized.y) * (180 / Math.PI);
                const longitude = Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180;

                // Calculate impact angle
                const surfaceNormal = pos.clone().normalize();
                const velocityNormalized = vel.clone().normalize();
                const cosAngle = -surfaceNormal.dot(velocityNormalized);
                const impactAngle = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);

                impactData = {
                    location: { latitude, longitude },
                    angle: impactAngle,
                    velocity: vel.length() / 1000 // Convert to km/s
                };
                break;
            }

            // Check if escaped (too far away)
            if (r > R_EARTH_REAL * 100) {
                break;
            }

            [pos, vel] = rk4Step(pos, vel, dt);
            step++;
        }

        return { positions, crashed, impactData, steps: step };
    };

    // Precompute trajectory
    const trajectoryData = useMemo(() => {
        if (!show || !initialLocation) return null;

        // Convert initial lat/lon to 3D position at specified distance
        const { latitude, longitude } = initialLocation;
        const phi = (90 - latitude) * (Math.PI / 180);
        const theta = (longitude + 180) * (Math.PI / 180);

        // Unit vectors for the coordinate system at this point
        const radialUnit = new THREE.Vector3(
            -Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta)
        );

        // East unit vector (tangent to longitude lines)
        const eastUnit = new THREE.Vector3(
            Math.sin(theta),
            0,
            Math.cos(theta)
        );

        // North unit vector (tangent to latitude lines)
        const northUnit = new THREE.Vector3(
            -Math.cos(phi) * Math.cos(theta),
            -Math.sin(phi),
            Math.cos(phi) * Math.sin(theta)
        );

        // Initial position in real units (m)
        const distanceM = params.distance * 1000 * 1000; // Convert from thousands of km to m
        const initial_pos_real = radialUnit.clone().multiplyScalar(R_EARTH_REAL + distanceM);

        // Initial velocity in real units (m/s)
        const vel_real = new THREE.Vector3();
        vel_real.addScaledVector(eastUnit, params.horizontal_velocity_km_s * 1000);
        vel_real.addScaledVector(northUnit, params.vertical_velocity_km_s * 1000);
        vel_real.addScaledVector(radialUnit, -params.z_velocity_km_s * 1000); // Negative for toward Earth

        // Run simulation
        const dt = 0.5; // Time step in seconds
        const { positions: positions_real, crashed, impactData, steps } = simulate(initial_pos_real, vel_real, dt);

        // Convert positions to model units
        const positions_model = positions_real.map((p) =>
            p.clone().multiplyScalar(1 / R_EARTH_REAL)
        );

        // Animation timing
        const baseTime = 5;
        const animationTime = params.simulation_speed > 0 ? baseTime * (50 / params.simulation_speed) : Infinity;

        return {
            positions_model,
            total_steps: steps,
            animationTime,
            crashed,
            impactData
        };
    }, [show, params, initialLocation]);

    // Animation state
    const elapsedTimeRef = useRef(0);
    const impactHandledRef = useRef(false);

    useEffect(() => {
        if (show && asteroidRef.current && trajectoryData) {
            asteroidRef.current.position.copy(trajectoryData.positions_model[0]);
            elapsedTimeRef.current = 0;
            impactHandledRef.current = false;
        }
    }, [show, trajectoryData]);

    useFrame((state, delta) => {
        if (show && asteroidRef.current && trajectoryData && params.simulation_speed > 0) {
            elapsedTimeRef.current += delta;

            let frac = elapsedTimeRef.current / trajectoryData.animationTime;
            if (frac >= 1) {
                frac = 1;
                if (trajectoryData.crashed && !impactHandledRef.current) {
                    impactHandledRef.current = true;
                    onImpact(trajectoryData.impactData);
                }
            }

            const step = Math.min(
                Math.floor(frac * (trajectoryData.total_steps - 1)),
                trajectoryData.positions_model.length - 1
            );
            if (trajectoryData.positions_model[step]) {
                asteroidRef.current.position.copy(trajectoryData.positions_model[step]);
            }
        }
    });

    const baseSize = 0.0001;
    const scaleFactor = 0.0001;
    const asteroidSize = Math.max(baseSize, params.diameter_km * scaleFactor);

    if (!show || !trajectoryData) return null;

    return (
        <>
            <Sphere ref={asteroidRef} args={[asteroidSize, 16, 16]}>
                <meshStandardMaterial
                    color="#888888"
                    roughness={0.9}
                    emissive="#ff5555"
                    emissiveIntensity={0.3}
                />
                <Html distanceFactor={2}>
                    <div className="bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                        Asteroid ({params.diameter_km} km)
                        {trajectoryData.crashed === false && " - Will miss Earth"}
                    </div>
                </Html>
            </Sphere>

            {/* Show initial position marker */}
            {initialLocation && (
                <Sphere
                    position={trajectoryData.positions_model[0]}
                    args={[0.02, 8, 8]}
                >
                    <meshBasicMaterial color="#00ff00" opacity={0.5} transparent />
                </Sphere>
            )}
        </>
    );
}

export default function EarthScene({ impactPoint, blastRadius, showAsteroid, params, initialLocation, onImpact }) {
    return (
        <div className="w-full h-full bg-black">
            <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
                <ambientLight intensity={0.15} />
                <directionalLight
                    position={[15, 2, 0]}
                    intensity={2.0}
                    color="#ffffff"
                />
                <pointLight position={[-10, 0, -5]} intensity={0.2} color="#4466ff" />
                <Sun />
                <Earth impactPoint={impactPoint} blastRadius={blastRadius} />
                <Moon />
                <AsteroidApproach
                    show={showAsteroid}
                    params={params}
                    initialLocation={initialLocation}
                    onImpact={onImpact}
                />
                <OrbitControls
                    enablePan={false}
                    minDistance={2}
                    maxDistance={30}
                    autoRotate
                    autoRotateSpeed={0.3}
                />
                <mesh>
                    <sphereGeometry args={[100, 32, 32]} />
                    <meshBasicMaterial color="#000011" side={THREE.BackSide} />
                </mesh>
            </Canvas>
        </div>
    );
}