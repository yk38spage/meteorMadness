import React, { useEffect, useState } from 'react'
import EarthScene from '../../components/EarthScene/EarthScene';
import { fetchAsteroids, simulateImpact, evaluateMitigation } from '../../fetch/api_service';
import ControlPanel from '../../components/ControlPanel/ControlPanel';
import ResultsDashboard from '../../components/ResultsDashboard/ResultsDashboard';
import { Loader2 } from 'lucide-react';
import Button from '../../assets/Button/Button';


const Homepage = () => {
    const [asteroids, setAsteroids] = useState([]);
    const [params, setParams] = useState({
        diameter_km: 0.5,
        horizontal_velocity_km_s: 20,
        vertical_velocity_km_s: 20,
        z_velocity_km_s: 20,
        distance: 150, // in thousands of km
        latitude: 40.7,
        longitude: -74,
        density_kg_m3: 3000,
        simulation_speed: 50
    });
    const [results, setResults] = useState(null);
    const [mitigationResults, setMitigationResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingAsteroids, setLoadingAsteroids] = useState(true);
    const [showAsteroid, setShowAsteroid] = useState(false);
    const [impactData, setImpactData] = useState(null);

    // Fetch asteroids on mount
    useEffect(() => {
        const loadAsteroids = async () => {
            try {
                const data = await fetchAsteroids();
                setAsteroids(data.asteroids || []);
            } catch (error) {
                console.error('Failed to load asteroids:', error);
                // Fallback data if API fails
                setAsteroids([
                    { id: '1', name: 'Impactor-2025', diameter_km: 1.5, velocity_km_s: 25, is_potentially_hazardous: true },
                    { id: '2', name: 'Apophis', diameter_km: 0.34, velocity_km_s: 30.7, is_potentially_hazardous: true },
                    { id: '3', name: 'Bennu', diameter_km: 0.49, velocity_km_s: 28, is_potentially_hazardous: true },
                ]);
            } finally {
                setLoadingAsteroids(false);
            }
        };

        loadAsteroids();
    }, []);

    const handleSimulate = async () => {
        setLoading(true);
        setShowAsteroid(true);
        setMitigationResults(null);
        setResults(null); // Clear previous results
        setImpactData(null); // Clear previous impact data

        // Note: The actual impact calculation now happens in the 3D simulation
        // We'll wait for the onImpact callback to get the actual impact data
        setLoading(false);
    };

    const handleOnImpact = async (data) => {
        setShowAsteroid(false);

        if (data) {
            // Asteroid hit Earth
            setImpactData(data);

            // Call the API with actual impact data
            setLoading(true);
            try {
                const apiParams = {
                    ...params,
                    // Use actual impact data
                    impact_latitude: data.location.latitude,
                    impact_longitude: data.location.longitude,
                    impact_angle: data.angle,
                    impact_velocity_km_s: data.velocity
                };

                const apiResults = await simulateImpact(apiParams);

                setResults({
                    ...apiResults,
                    impact_location: data.location,
                    impact_angle: data.angle,
                    impact_velocity: data.velocity,
                    impact_occurred: true
                });
            } catch (error) {
                console.error('Simulation failed:', error);
                // Still show basic impact data even if API fails
                setResults({
                    impact_location: data.location,
                    impact_angle: data.angle,
                    impact_velocity: data.velocity,
                    impact_occurred: true,
                    error: 'Failed to calculate detailed impact effects'
                });
            } finally {
                setLoading(false);
            }
        } else {
            // Asteroid missed Earth
            setResults({
                impact_occurred: false,
                message: 'The asteroid missed Earth and continued into space.'
            });
        }
    };

    const handleMitigate = async (mitigationParams) => {
        setLoading(true);

        try {
            const data = await evaluateMitigation(mitigationParams);
            setMitigationResults(data);
        } catch (error) {
            console.error('Mitigation evaluation failed:', error);
            alert('Mitigation evaluation failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loadingAsteroids) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                    <p>Loading asteroid data from NASA...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex overflow-hidden bg-gray-900">
            {/* Left Panel - Controls */}
            <div className="w-96 flex-shrink-0 border-r border-gray-800">
                <ControlPanel
                    asteroids={asteroids}
                    params={params}
                    setParams={setParams}
                    onSimulate={handleSimulate}
                    onMitigate={handleMitigate}
                    loading={loading}
                />
            </div>

            {/* Center Panel - 3D Visualization */}
            <div className="flex-1 relative">
                <EarthScene
                    impactPoint={impactData?.location}
                    blastRadius={results?.damage_zones?.blast_radius_km}
                    showAsteroid={showAsteroid}
                    params={params}
                    initialLocation={{ latitude: params.latitude, longitude: params.longitude }}
                    onImpact={handleOnImpact}
                />

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-gray-800 rounded-lg p-6 text-white text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                            <p className="font-semibold">
                                {showAsteroid ? 'Simulating trajectory...' : 'Calculating impact effects...'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Info Overlay */}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
                    <div className="font-bold mb-1">🌍 Interactive Earth</div>
                    <div className="text-xs text-gray-300">
                        • Drag to rotate<br />
                        • Scroll to zoom<br />
                        • Green marker: Initial position<br />
                        {impactData && (
                            <>
                                • Red marker: Impact point<br />
                                • Orange ring: Blast radius
                            </>
                        )}
                        {results?.impact_occurred === false && (
                            <>• Asteroid missed Earth!</>
                        )}
                    </div>
                </div>

                {/* Impact Info Overlay */}
                {impactData && (
                    <div className="absolute bottom-4 left-4 bg-red-900/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
                        <div className="font-bold mb-1">⚠️ Impact Detected!</div>
                        <div className="text-xs">
                            • Location: {impactData.location.latitude.toFixed(2)}°, {impactData.location.longitude.toFixed(2)}°<br />
                            • Impact Angle: {impactData.angle.toFixed(1)}°<br />
                            • Impact Velocity: {impactData.velocity.toFixed(1)} km/s
                        </div>
                    </div>
                )}

                {/* Miss Info Overlay */}
                {results?.impact_occurred === false && (
                    <div className="absolute bottom-4 left-4 bg-green-900/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
                        <div className="font-bold mb-1">✅ Earth is Safe!</div>
                        <div className="text-xs">
                            The asteroid's trajectory will miss Earth and continue into space.
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel - Results */}
            <div className="w-96 flex-shrink-0 border-l border-gray-800 bg-gray-900 overflow-y-auto">
                <div className="p-4">
                    <h2 className="text-xl font-bold text-white mb-4">Impact Analysis</h2>
                    {results?.impact_occurred === false ? (
                        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 text-white">
                            <h3 className="font-bold mb-2">No Impact</h3>
                            <p className="text-sm">
                                The asteroid will safely pass by Earth without impacting.
                                Try adjusting the velocity parameters or initial position to create different scenarios.
                            </p>
                        </div>
                    ) : (
                        <ResultsDashboard
                            results={results}
                            mitigationResults={mitigationResults}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Homepage