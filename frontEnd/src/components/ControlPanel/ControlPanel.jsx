import { useState } from 'react';
import { Rocket, MapPin, Settings, Shield } from 'lucide-react';
import Button from '../../assets/Button/Button';
import ButtonSpinner from '../../assets/Spinner/ButtonSpinner';
import './ControlPanel.css';

export default function ControlPanel({
    asteroids,
    params,
    setParams,
    onSimulate,
    onMitigate,
    loading,
    children = null,
    show = true
}) {
    const [showMitigation, setShowMitigation] = useState(false);
    const [mitigationYears, setMitigationYears] = useState(5);
    const [mitigationMethod, setMitigationMethod] = useState('kinetic_impactor');

    const handleAsteroidSelect = (e) => {
        const asteroid = asteroids.find(a => a.id === e.target.value);
        console.log(asteroid)
        if (asteroid) {
            setParams({
                ...params,
                diameter_km: asteroid.diameter_km,
                velocity_km_s: asteroid.velocity_km_s,
                horizontal_velocity_km_s: asteroid.horizontal_velocity_km_s,
                vertical_velocity_km_s: asteroid.vertical_velocity_km_s,
                z_velocity_km_s: asteroid.z_velocity_km_s,
                distance: Math.round(asteroid.miss_distance_km / 10000),
                mitigation_method: mitigationMethod
            });
        }
    };

    const handleMitigate = () => {
        const velocityMagnitude = Math.sqrt(
            params.horizontal_velocity_km_s ** 2 +
            params.vertical_velocity_km_s ** 2 +
            params.z_velocity_km_s ** 2
        );
        onMitigate({
            diameter_km: params.diameter_km,
            velocity_km_s: params.velocity_km_s || velocityMagnitude,  // Fallback to magnitude
            years_before_impact: mitigationYears,
            method: mitigationMethod,
            latitude: params.latitude,
            longitude: params.longitude,
            distance: params.distance,
            horizontal_velocity_km_s: params.horizontal_velocity_km_s,
            vertical_velocity_km_s: params.vertical_velocity_km_s,
            z_velocity_km_s: params.z_velocity_km_s
        });

    };

    return (
        <div className="flex-shrink-0 control-panel-container">
            <div className={`h-full overflow-y-auto bg-gray-900 text-white p-6 space-y-6 control-panel ${show ? '' : 'hidden'}`}>
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r bg-clip-text text-transparent" >
                        Asteroid Impact Simulator
                    </h1>
                    <p className="text-sm text-gray-400">
                        Model asteroid trajectories and potential impacts
                    </p>
                </div>

                {/* Asteroid Selector */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <i className="fa-solid fa-meteor"></i>
                        Select Asteroid Template
                    </label>
                    <select
                        onChange={handleAsteroidSelect}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                    >
                        <option value="">Custom parameters...</option>
                        {asteroids.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.name} ({a.diameter_km} km)
                                {/* {a.name} ({a.diameter_km} km, {a.velocity_km_s} km/s) */}
                                {a.is_potentially_hazardous ? ' ⚠️' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Parameters */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <i className="fa-solid fa-gear"></i>
                        Asteroid Properties
                    </div>

                    {/* Diameter */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                            Diameter (km): {params.diameter_km}
                        </label>
                        <input
                            type="number"
                            min="0.01"
                            max="1000"
                            step="0.01"
                            value={params.diameter_km}
                            onChange={(e) => setParams({ ...params, diameter_km: parseFloat(e.target.value) })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0.01 km</span>
                            <span>1000 km</span>
                        </div>
                    </div>

                    {/* Initial Position Section */}
                    <div className="border-t border-gray-700 pt-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                            <i className="fa-solid fa-satellite"></i>
                            Initial Position in Space
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Start Latitude</label>
                                <input
                                    type="number"
                                    min="-90"
                                    max="90"
                                    step="0.1"
                                    value={params.latitude}
                                    onChange={(e) => setParams({ ...params, latitude: parseFloat(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Start Longitude</label>
                                <input
                                    type="number"
                                    min="-180"
                                    max="180"
                                    step="0.1"
                                    value={params.longitude}
                                    onChange={(e) => setParams({ ...params, longitude: parseFloat(e.target.value) })}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                                Distance from Earth (×1,0000 km): {params.distance}
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="10000"
                                step="10"
                                value={params.distance}
                                onChange={(e) => setParams({ ...params, distance: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>10,000 km</span>
                                <span>10,000,000 km</span>
                            </div>
                        </div>

                        {/* Quick Position Presets */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-xs text-gray-500">Above:</span>
                            <button
                                onClick={() => setParams({ ...params, latitude: 40.7, longitude: -74 })}
                                className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
                            >
                                NYC
                            </button>
                            <button
                                onClick={() => setParams({ ...params, latitude: 51.5, longitude: -0.1 })}
                                className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
                            >
                                London
                            </button>
                            <button
                                onClick={() => setParams({ ...params, latitude: 35.7, longitude: 139.7 })}
                                className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
                            >
                                Tokyo
                            </button>
                            <button
                                onClick={() => setParams({ ...params, latitude: 0, longitude: -30 })}
                                className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
                            >
                                Atlantic
                            </button>
                        </div>
                    </div>

                    {/* Velocity Components */}
                    <div className="border-t border-gray-700 pt-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">
                            <i className="fa-solid fa-arrow-right-long"></i>
                            Initial Velocity Components
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">
                                East-West Velocity: {params.horizontal_velocity_km_s} km/s
                            </label>
                            <input
                                type="range"
                                min="-120"
                                max="120"
                                step="0.1"
                                value={params.horizontal_velocity_km_s}
                                onChange={(e) => setParams({ ...params, horizontal_velocity_km_s: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>← 120 km/s West</span>
                                <span>120 km/s East →</span>
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="text-xs text-gray-400 mb-1 block">
                                North-South Velocity: {params.vertical_velocity_km_s} km/s
                            </label>
                            <input
                                type="range"
                                min="-120"
                                max="120"
                                step="0.1"
                                value={params.vertical_velocity_km_s}
                                onChange={(e) => setParams({ ...params, vertical_velocity_km_s: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>↓ 120 km/s South</span>
                                <span>120 km/s North ↑</span>
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="text-xs text-gray-400 mb-1 block">
                                Radial Velocity (toward Earth): {params.z_velocity_km_s} km/s
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="120"
                                step="0.1"
                                value={params.z_velocity_km_s}
                                onChange={(e) => setParams({ ...params, z_velocity_km_s: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>0 km/s (stationary)</span>
                                <span>120 km/s (toward Earth)</span>
                            </div>
                        </div>

                        <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded text-xs text-blue-300">
                            <i className="fa-solid fa-lightbulb"></i> Tip: Higher radial velocity increases impact likelihood. Adjust E-W and N-S velocities to change impact location.
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <i className="fa-solid fa-gauge"></i>
                        Animation Speed
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={params.simulation_speed}
                        onChange={(e) => setParams({ ...params, simulation_speed: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Pause (0)</span>
                        <span>Fast (100)</span>
                    </div>
                </div>

                {/* Simulate Button */}
                {loading ? (
                    <Button type="button" priority="primary" icon="fa-solid fa-play" onClick={onSimulate} disabled><ButtonSpinner />Simulating...</Button>
                ) : (
                    <Button type="button" priority="primary" icon="fa-solid fa-play" onClick={onSimulate}>Simulate Trajectory</Button>
                )}

                {/* Mitigation Section */}
                <div className="border-t border-gray-700 pt-4 space-y-3 flex flex-col gap-2">
                    <button
                        onClick={() => setShowMitigation(!showMitigation)}
                        className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                    >
                        <Shield className="w-4 h-4" />
                        Mitigation Strategies
                        <span className="text-xs ml-auto">{showMitigation ? '▼' : '▶'}</span>
                    </button>

                    {/* {showMitigation && ( */}
                        <div className="space-y-3 pl-6 flex flex-col gap-2">
                            {/* <div>
                                <label className="text-xs text-gray-400 mb-1 block">
                                    Warning Time: {mitigationYears} years
                                </label>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="20"
                                    step="0.5"
                                    value={mitigationYears}
                                    onChange={(e) => setMitigationYears(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                                />
                            </div> */}

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Method</label>
                                <select
                                    value={mitigationMethod}
                                    onChange={(e) => setParams({...params, mitigation_method: e.target.value})}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
                                >
                                    <option value="kinetic_impactor">Kinetic Impactor</option>
                                    <option value="gravity_tractor">Gravity Tractor</option>
                                </select>
                            </div>

                            <Button
                                type="button"
                                priority="primary"
                                icon="fa-solid fa-shield-halved"
                                onClick={onSimulate}
                                disabled={loading}
                            >
                                {loading ? 'Evaluating...' : 'Evaluate Defense'}
                            </Button>
                        </div>
                    {/* )} */}
                </div>

                {/* Info Box */}
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-xs text-gray-300">
                    <div className="font-semibold mb-1 text-blue-400"><i className="fa-solid fa-circle-info"></i> How it Works</div>
                    <p>Set the asteroid's starting position and velocity. The simulator will calculate if and where it impacts Earth using real physics.</p>
                </div>
            </div>
            {children}
        </div>
    );
}