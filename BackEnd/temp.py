async def simulate_impact(request: ImpactRequest):
    """Asteroid çarpma etkilerini hesapla"""

    # Temel parametreler
    diameter_km = request.diameter_km
    velocity_km_s = request.velocity_km_s
    angle = request.angle
    density_kg_m3 = request.density_kg_m3

    # Kütle hesaplama
    radius_m = (diameter_km * 1000) / 2
    volume_m3 = (4 / 3) * np.pi * (radius_m ** 3)
    mass_kg = volume_m3 * density_kg_m3

    # Kinetik enerji
    velocity_m_s = velocity_km_s * 1000
    energy_joules = 0.5 * mass_kg * (velocity_m_s ** 2)
    energy_megatons = energy_joules / 4.184e15

    # Açı düzeltmesi (45 derece optimal)
    angle_factor = np.sin(np.radians(angle))
    effective_energy = energy_joules * angle_factor

    # Krater çapı (Holsapple scaling)
    # D_crater = 1.8 * D_projectile * (rho_projectile/rho_target)^1/3 * (v^2/g*D_projectile)^0.22
    crater_diameter_km = 0.0012 * (diameter_km ** 0.78) * (velocity_km_s ** 0.44) * (density_kg_m3 / 2500) ** 0.33

    # Sismik büyüklük (Brown et al. 2002)
    if energy_joules > 0:
        magnitude = 0.67 * np.log10(energy_joules) - 5.87
    else:
        magnitude = 0

    # Patlama yarıçapı (yaklaşık)
    blast_radius_km = 2.2 * (energy_megatons ** 0.33)

    # Termal radyasyon yarıçapı
    thermal_radius_km = 0.14 * (energy_megatons ** 0.41)

    # Atmosferik patlama kontrolü (küçük asteroidler havada parçalanır)
    airburst = diameter_km < 0.1 and density_kg_m3 < 3500

    # Tsunami riski (okyanusa düşerse)
    tsunami_risk = "high" if request.latitude < 60 and abs(request.longitude) < 180 else "low"

    # Karşılaştırma için referans değerler
    hiroshima_megatons = 0.015
    comparison = {
        "hiroshima_equivalent": round(energy_megatons / hiroshima_megatons, 1),
        "severity": get_severity_level(energy_megatons)
    }

    return {
        "impact_energy": {
            "joules": energy_joules,
            "megatons": round(energy_megatons, 3),
            "kilotons": round(energy_megatons * 1000, 1)
        },
        "crater": {
            "diameter_km": round(crater_diameter_km, 2),
            "depth_km": round(crater_diameter_km / 5, 2),  # Depth ≈ diameter/5
            "airburst": airburst
        },
        "seismic": {
            "magnitude": round(magnitude, 2),
            "description": get_earthquake_description(magnitude)
        },
        "damage_zones": {
            "blast_radius_km": round(blast_radius_km, 1),
            "thermal_radius_km": round(thermal_radius_km, 1),
            "tsunami_risk": tsunami_risk
        },
        "impact_location": {
            "latitude": request.latitude,
            "longitude": request.longitude
        },
        "comparison": comparison,
        "asteroid_params": {
            "mass_kg": mass_kg,
            "diameter_km": diameter_km,
            "velocity_km_s": velocity_km_s,
            "angle_degrees": angle
        }
    }