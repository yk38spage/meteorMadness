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
        velocity_km_s: 20,
        angle: 45,
        latitude: 40.7,
        longitude: -74,
        density_kg_m3: 3000
    });
    const [results, setResults] = useState(null);
    const [mitigationResults, setMitigationResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingAsteroids, setLoadingAsteroids] = useState(true);
    const [showAsteroid, setShowAsteroid] = useState(false);

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
        setMitigationResults(null); // Clear previous mitigation results

        try {
            const data = await simulateImpact(params);
            setResults(data);

            // Small delay for dramatic effect
            setTimeout(() => {
                setShowAsteroid(false);
            }, 1000);
        } catch (error) {
            console.error('Simulation failed:', error);
            alert('Simulation failed. Please try again.');
        } finally {
            setLoading(false);
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
                    impactPoint={results?.impact_location}
                    blastRadius={results?.damage_zones.blast_radius_km}
                    showAsteroid={showAsteroid}
                />

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-gray-800 rounded-lg p-6 text-white text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                            <p className="font-semibold">Calculating impact effects...</p>
                        </div>
                    </div>
                )}

                {/* Info Overlay */}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-white text-sm max-w-xs">
                    <div className="font-bold mb-1">🌍 Interactive Earth</div>
                    <div className="text-xs text-gray-300">
                        • Drag to rotate<br />
                        • Scroll to zoom<br />
                        • Red marker shows impact point<br />
                        • Orange ring shows blast radius
                    </div>
                </div>
            </div>

            {/* Right Panel - Results */}
            <div className="w-96 flex-shrink-0 border-l border-gray-800 bg-gray-900 overflow-y-auto">
                <div className="p-4">
                    <h2 className="text-xl font-bold text-white mb-4">Impact Analysis</h2>
                    <ResultsDashboard
                        results={results}
                        mitigationResults={mitigationResults}
                    />
                </div>
            </div>
        </div>
    );
}

export default Homepage