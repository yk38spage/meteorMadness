import { Zap, Mountain, Activity, AlertCircle, Flame, Droplets } from 'lucide-react';

export default function ResultsDashboard({ results, mitigationResults }) {
    if (!results) {
        return (
            <div className="p-6 text-center text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Run a simulation to see impact results</p>
            </div>
        );
    }

    const metrics = [
        {
            icon: Zap,
            label: 'Impact Energy',
            value: `${results.impact_energy.megatons} MT`,
            subtitle: `${results.impact_energy.kilotons} kilotons`,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10'
        },
        {
            icon: Mountain,
            label: 'Crater Size',
            value: `${results.crater.diameter_km} km`,
            subtitle: results.crater.airburst ? 'Airburst (no crater)' : `Depth: ${results.crater.depth_km} km`,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10'
        },
        {
            icon: Activity,
            label: 'Seismic Magnitude',
            value: results.seismic.magnitude,
            subtitle: results.seismic.description,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10'
        },
        {
            icon: Flame,
            label: 'Blast Radius',
            value: `${results.damage_zones.blast_radius_km} km`,
            subtitle: 'Destruction zone',
            color: 'text-red-600',
            bgColor: 'bg-red-600/10'
        },
        {
            icon: Flame,
            label: 'Thermal Radius',
            value: `${results.damage_zones.thermal_radius_km} km`,
            subtitle: 'Severe burns',
            color: 'text-orange-600',
            bgColor: 'bg-orange-600/10'
        },
        {
            icon: Droplets,
            label: 'Tsunami Risk',
            value: results.damage_zones.tsunami_risk.toUpperCase(),
            subtitle: 'Based on location',
            color: results.damage_zones.tsunami_risk === 'high' ? 'text-blue-500' : 'text-gray-500',
            bgColor: results.damage_zones.tsunami_risk === 'high' ? 'bg-blue-500/10' : 'bg-gray-500/10'
        }
    ];

    return (
        <div className="space-y-4">
            {/* Severity Banner */}
            <div className={`p-4 rounded-lg ${results.comparison.severity.includes('Extinction') ? 'bg-red-900/50 border-2 border-red-500' :
                    results.comparison.severity.includes('Catastrophic') ? 'bg-orange-900/50 border-2 border-orange-500' :
                        results.comparison.severity.includes('Severe') ? 'bg-yellow-900/50 border-2 border-yellow-500' :
                            'bg-blue-900/50 border-2 border-blue-500'
                }`}>
                <div className="font-bold text-lg mb-1">Impact Assessment</div>
                <div className="text-sm">{results.comparison.severity}</div>
                <div className="text-xs mt-2 opacity-75">
                    ≈ {results.comparison.hiroshima_equivalent}× Hiroshima bomb
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {metrics.map((metric, i) => (
                    <div key={i} className={`${metric.bgColor} rounded-lg p-4 border border-gray-700`}>
                        <metric.icon className={`w-6 h-6 mb-2 ${metric.color}`} />
                        <div className="text-2xl font-bold text-white">{metric.value}</div>
                        <div className="text-xs font-semibold text-gray-300 mb-1">{metric.label}</div>
                        <div className="text-xs text-gray-400">{metric.subtitle}</div>
                    </div>
                ))}
            </div>

            {/* Mitigation Results */}
            {mitigationResults && (
                <div className={`p-4 rounded-lg border-2 ${mitigationResults.success ? 'bg-green-900/50 border-green-500' : 'bg-red-900/50 border-red-500'
                    }`}>
                    <div className="font-bold text-lg mb-2">
                        {mitigationResults.method} Strategy
                    </div>
                    <div className="text-sm space-y-1">
                        <div>Success Probability: <span className="font-bold">{mitigationResults.success_probability}%</span></div>
                        <div>Mission Cost: <span className="font-bold">${mitigationResults.mission_cost_billion_usd}B USD</span></div>
                        <div className="text-xs text-gray-300 mt-2">{mitigationResults.description}</div>
                    </div>
                    {mitigationResults.deflection_distance_km && (
                        <div className="mt-2 text-xs">
                            Deflection: <span className="font-bold">{mitigationResults.deflection_distance_km} km</span>
                        </div>
                    )}
                </div>
            )}

            {/* Impact Details */}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-xs">
                <div className="font-semibold mb-2 text-gray-300">Impact Details</div>
                <div className="space-y-1 text-gray-400">
                    {/* <div>Asteroid Mass: {(results.asteroid_params.mass_kg / 1e9).toFixed(2)} billion kg</div> */}
                    <div>Diameter: {results.asteroid_params.diameter_km} km</div>
                    <div>Velocity: {results.asteroid_params.velocity_km_s.toFixed(2)} km/s</div>
                    <div>Impact Angle: {results.asteroid_params.angle_degrees.toFixed(2)}°</div>
                    <div>Location: {results.impact_location.latitude.toFixed(6)}, {results.impact_location.longitude.toFixed(6)}</div>
                </div>
            </div>
        </div>
    );
}
