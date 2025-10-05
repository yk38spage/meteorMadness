import { Zap, Mountain, Activity, AlertCircle, Flame, Droplets } from 'lucide-react';

export default function ResultsDashboard({ results }) {
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

    const mitigationResults = (result) => {
        if (!result) {
            return {
                mitigation_required: false,
                description: "No result to evaluate."
            };
        }

        if (result.crater.airburst) {
            return {
                mitigation_required: false,
                description: "Airburst will likely occur, no mitigation required."
            };
        }

        const asteroid = result.asteroid_params;
        const mass = asteroid.mass_kg;
        const diameter = asteroid.diameter_km;
        const velocity = asteroid.velocity_km_s * 1000; // Convert to m/s for calcs

        switch (result.mitigation_method) {
            case "kinetic_impactor": {
                // Assumptions from DART/NASA: 500 kg impactor at 6 km/s relative velocity, β=3.6 (momentum enhancement)
                const impactorMass = 500; // kg
                const impactVelocity = 6000; // m/s
                const beta = 3.6;
                const deltaV = (impactorMass * impactVelocity * beta) / mass * 100; // cm/s (scaled for realism)
                const leadTimeYears = Math.max(5, diameter * 5); // Rough min warning (years); scales with size
                const successProb = 0.90; // High confidence post-DART; drops for rubble piles
                return {
                    mitigation_required: true,
                    method: "Kinetic Impactor",
                    success_probability: `${(successProb * 100).toFixed(0)}%`,
                    mission_cost: Number(diameter) * 750000000,
                    deflection: `${deltaV.toFixed(2)} cm/s velocity change`,
                    lead_time_years: leadTimeYears,
                    description: "A spacecraft impacts the asteroid at high speed, transferring momentum (enhanced by ejecta) to alter its path. Proven by NASA's DART mission; effective for warnings of 5+ years but risks fragmentation for porous asteroids.",
                    feasible: leadTimeYears <= 10 // Arbitrary threshold for your sim; adjust based on discovery date
                };
            }
            case "gravity_tractor": {
                // Assumptions from Lu/Love NASA studies: 20-ton (20,000 kg) spacecraft, 100m hover distance, 0.3 N thrust, 10-year mission
                const spacecraftMass = 20000; // kg
                const hoverDistance = 100; // meters
                const thrust = 0.3; // Newtons (solar-electric propulsion)
                const missionDuration = 10 * 365 * 24 * 3600; // 10 years in seconds
                const deltaV = (G * spacecraftMass * missionDuration * thrust) / (Math.pow(hoverDistance, 2) * mass / 10000) * 100; // cm/s (approx; simplified tug force)
                const leadTimeYears = Math.max(15, diameter * 10); // Requires decades for km-scale
                const successProb = 0.85; // High for long missions; precise but slow
                return {
                    mitigation_required: true,
                    method: "Gravity Tractor",
                    success_probability: `${(successProb * 100).toFixed(0)}%`,
                    mission_cost: "$2B - $5B (long-duration rendezvous mission)",
                    deflection: `${deltaV.toFixed(2)} cm/s velocity change`,
                    lead_time_years: leadTimeYears,
                    description: "A spacecraft hovers near the asteroid, using its gravity and low-thrust propulsion to slowly tug it off course over years. Non-disruptive and precise; ideal for 15+ year warnings but requires extended operations.",
                    feasible: leadTimeYears <= 30
                };
            }
            default:
                return {
                    mitigation_required: false,
                    error: "Unknown mitigation method. Supported: 'kinetic_impactor', 'gravity_tractor'."
                };
        }
    };

    const mitigation = mitigationResults(results);

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
            {mitigation && (
                mitigation.mitigation_required ? (
                    <div className={`p-4 rounded-lg border-2 ${mitigation.feasible ? 'bg-green-900/50 border-green-500' : 'bg-red-900/50 border-red-500'}`}>
                        <div className="font-bold text-lg mb-2">
                            {mitigation.method} Strategy
                        </div>
                        <div className="text-sm space-y-1">
                            <div>Success Probability: <span className="font-bold">{mitigation.success_probability}</span></div>
                            <div>Mission Cost: <span className="font-bold">${(mitigation.mission_cost / 1e9).toFixed(2)}B</span></div>
                            <div>Deflection: <span className="font-bold">{mitigation.deflection} cm/s</span></div>
                            <div>Lead Time: <span className="font-bold">{mitigation.lead_time_years} years</span></div>
                            <div>Description: <span className="text-gray-300">{mitigation.description}</span></div>
                        </div>
                    </div>
                ) : (
                    <div className={`p-4 rounded-lg border-2 bg-green-900/50 border-green-500}`}>
                        <div className="font-bold text-lg mb-2">
                            No Mitigation Required
                        </div>
                        <div className="mt-2 text-xs">
                            {mitigation.description}
                        </div>
                    </div>
                )
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
