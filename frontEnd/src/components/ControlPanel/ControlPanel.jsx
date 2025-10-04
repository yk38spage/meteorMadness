import { useState } from 'react';
import { Rocket, MapPin, Settings, Shield } from 'lucide-react';

export default function ControlPanel({
    asteroids,
    params,
    setParams,
    onSimulate,
    onMitigate,
    loading
}) {
    const [showMitigation, setShowMitigation] = useState(false);
    const [mitigationYears, setMitigationYears] = useState(5);
    const [mitigationMethod, setMitigationMethod] = useState('kinetic_impactor');

    const handleAsteroidSelect = (e) => {
        const asteroid = asteroids.find(a => a.id === e.target.value);
        if (asteroid) {
            setParams({
                ...params,
                diameter_km: asteroid.diameter_km,
                velocity_km_s: asteroid.velocity_km_s
            });
        }
    };

    const handleMitigate = () => {
        onMitigate({
            diameter_km: params.diameter_km,
            velocity_km_s: params.velocity_km_s,
            years_before_impact: mitigationYears,
            method: mitigationMethod
        });
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-900 text-white p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                    Asteroid Impact Simulator
                </h1>
                <p className="text-sm text-gray-400">
                    Model asteroid impacts and mitigation strategies
                </p>
            </div>

            {/* Asteroid Selector */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    {/* <Rocket className="w-4 h-4" /> */}
                    <i className="fa-solid fa-meteor"></i>
                    Select Asteroid
                </label>
                <select
                    onChange={handleAsteroidSelect}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                >
                    <option value="">Choose an asteroid...</option>
                    {asteroids.map(a => (
                        <option key={a.id} value={a.id}>
                            {a.name} ({a.diameter_km} km, {a.velocity_km_s} km/s)
                            {a.is_potentially_hazardous ? ' ⚠️' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Parameters */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <i className="fa-solid fa-gear"></i>
                    Impact Parameters
                </div>

                {/* Diameter */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                        Diameter (km):
                    </label>
                    {/* <input
                        type="range"
                        min="0.01"
                        max="1000"
                        step="0.01"
                        value={params.diameter_km}
                        onChange={(e) => setParams({ ...params, diameter_km: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    /> */}
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

                {/* Velocity */}
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                        Velocity: {params.velocity_km_s} km/s
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="70"
                        step="0.1"
                        value={params.velocity_km_s}
                        onChange={(e) => setParams({ ...params, velocity_km_s: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>10 km/s</span>
                        <span>70 km/s</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                        Horizontal Velocity: {params.horizontal_velocity_km_s} km/s
                    </label>
                    <input
                        type="range"
                        min="-120"
                        max="120"
                        step="0.1"
                        value={params.horizontal_velocity_km_s}
                        onChange={(e) => setParams({ ...params, horizontal_velocity_km_s: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>120 km/s west</span>
                        <span>120 km/s east</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                        Vertical Velocity: {params.vertical_velocity_km_s} km/s
                    </label>
                    <input
                        type="range"
                        min="-120"
                        max="120"
                        step="0.1"
                        value={params.vertical_velocity_km_s}
                        onChange={(e) => setParams({ ...params, vertical_velocity_km_s: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>120 km/s south</span>
                        <span>120 km/s north</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                        Depth Velocity: {params.z_velocity_km_s} km/s
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="120"
                        step="0.1"
                        value={params.z_velocity_km_s}
                        onChange={(e) => setParams({ ...params, z_velocity_km_s: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0 km/s to surface</span>
                        <span>120 km/s to surface</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                        Distance from the Earth (x1,000 km):
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="1000000"
                        step="1"
                        value={params.distance}
                        onChange={(e) => setParams({ ...params, distance: parseFloat(e.target.value) })}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500"
                    />
                </div>


                {/* Impact Angle */}
                {/* <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                        Impact Angle: {params.angle}°
                    </label>
                    <input
                        type="range"
                        min="15"
                        max="90"
                        step="5"
                        value={params.angle}
                        onChange={(e) => setParams({ ...params, angle: parseFloat(e.target.value) })}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>15° (shallow)</span>
                        <span>90° (vertical)</span>
                    </div>
                </div> */}
            </div>

            {/* Starting Location */}
            <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <i className="fa-solid fa-location-dot"></i>
                    {/* Impact Location */}
                    Starting Location
                </label>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Latitude</label>
                        <input
                            type="number"
                            min="-90"
                            max="90"
                            step="0.1"
                            value={params.latitude}
                            onChange={(e) => setParams({ ...params, latitude: parseFloat(e.target.value) })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Longitude</label>
                        <input
                            type="number"
                            min="-180"
                            max="180"
                            step="0.1"
                            value={params.longitude}
                            onChange={(e) => setParams({ ...params, longitude: parseFloat(e.target.value) })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-orange-500"
                        />
                    </div>
                </div>

                {/* Quick Location Presets */}
                <div className="flex flex-wrap gap-2">
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
                        Ocean
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                    <i className="fa-solid fa-gauge"></i>
                    Simulation Speed
                </label>
                <input
                    type="range"
                    min="0"
                    max="100"
                    
                    value={params.simulation_speed}
                    onChange={(e) => setParams({ ...params, simulation_speed: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0 km/s to surface</span>
                    <span>120 km/s to surface</span>
                </div>
            </div>

            {/* Simulate Button */}
            <button
                onClick={onSimulate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
            >
                {loading ? 'Simulating...' : <><i className="fa-solid fa-explosion"></i>Simulate Impact</>}
            </button>

            {/* Mitigation Section */}
            <div className="border-t border-gray-700 pt-4 space-y-3">
                <button
                    onClick={() => setShowMitigation(!showMitigation)}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                >
                    <Shield className="w-4 h-4" />
                    Mitigation Strategies
                    <span className="text-xs ml-auto">{showMitigation ? '▼' : '▶'}</span>
                </button>

                {showMitigation && (
                    <div className="space-y-3 pl-6">
                        <div>
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
                        </div>

                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Method</label>
                            <select
                                value={mitigationMethod}
                                onChange={(e) => setMitigationMethod(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:border-green-500"
                            >
                                <option value="kinetic_impactor">Kinetic Impactor</option>
                                <option value="gravity_tractor">Gravity Tractor</option>
                            </select>
                        </div>

                        <button
                            onClick={handleMitigate}
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white font-semibold py-2 rounded transition-all disabled:cursor-not-allowed"
                        >
                            {loading ? 'Evaluating...' : <><i className="fa-solid fa-shield-halved"></i>Evaluate Defense</>}
                        </button>
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-xs text-gray-300">
                <div className="font-semibold mb-1 text-blue-400">ℹ️ About</div>
                <p>This simulator uses real NASA data and physics-based calculations to model asteroid impacts and deflection strategies.</p>
            </div>
        </div>
    );
}