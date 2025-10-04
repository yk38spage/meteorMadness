import math
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import numpy as np
import os
from datetime import datetime, timedelta
from typing import Optional

app = FastAPI(title="Asteroid Impact Simulator API")

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
NASA_BASE_URL = "https://api.nasa.gov/neo/rest/v1"

# Request/Response modelleri
class ImpactRequest(BaseModel):
    diameter_km: float
    velocity_km_s: float
    angle: float = 45
    latitude: float = 0
    longitude: float = 0
    density_kg_m3: float = 3000

class MitigationRequest(BaseModel):
    diameter_km: float
    velocity_km_s: float
    years_before_impact: float
    method: str = "kinetic_impactor"

@app.get("/")
async def root():
    return {"message": "Asteroid Impact Simulator API", "version": "1.0"}

@app.get("/api/asteroids")
async def get_asteroids():
    """NASA NEO API'den yakın geçiş yapan asteroitleri getir"""
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        url = f"{NASA_BASE_URL}/feed"
        params = {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "api_key": NASA_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        asteroids = []
        for date_str, neo_list in data.get("near_earth_objects", {}).items():
            for neo in neo_list[:3]:  # Her günden 3 tane
                close_approach = neo["close_approach_data"][0]
                asteroids.append({
                    "id": neo["id"],
                    "name": neo["name"].replace("(", "").replace(")", ""),
                    "diameter_km": round(neo["estimated_diameter"]["kilometers"]["estimated_diameter_max"], 3),
                    "diameter_min_km": round(neo["estimated_diameter"]["kilometers"]["estimated_diameter_min"], 3),
                    "velocity_km_s": round(float(close_approach["relative_velocity"]["kilometers_per_second"]), 2),
                    "miss_distance_km": round(float(close_approach["miss_distance"]["kilometers"]), 0),
                    "close_approach_date": close_approach["close_approach_date"],
                    "is_potentially_hazardous": neo.get("is_potentially_hazardous_asteroid", False)
                })
        
        # En büyükten küçüğe sırala
        asteroids.sort(key=lambda x: x["diameter_km"], reverse=True)
        
        return {
            "count": len(asteroids),
            "asteroids": asteroids[:15]  # İlk 15 tanesi
        }
    
    except requests.RequestException as e:
        # API başarısız olursa fallback data
        return {
            "count": 5,
            "asteroids": [
                {"id": "1", "name": "Impactor-2025", "diameter_km": 1.5, "velocity_km_s": 25, "miss_distance_km": 0, "is_potentially_hazardous": True},
                {"id": "2", "name": "Apophis", "diameter_km": 0.34, "velocity_km_s": 30.7, "miss_distance_km": 31000, "is_potentially_hazardous": True},
                {"id": "3", "name": "Bennu", "diameter_km": 0.49, "velocity_km_s": 28, "miss_distance_km": 750000, "is_potentially_hazardous": True},
                {"id": "4", "name": "Tunguska-like", "diameter_km": 0.06, "velocity_km_s": 15, "miss_distance_km": 0, "is_potentially_hazardous": False},
                {"id": "5", "name": "Chicxulub-size", "diameter_km": 10, "velocity_km_s": 20, "miss_distance_km": 0, "is_potentially_hazardous": True}
            ]
        }

@app.post("/api/simulate")
async def simulate_impact(request: ImpactRequest):
    """Asteroid çarpma etkilerini hesapla"""
    
    # Temel parametreler
    diameter_km = request.diameter_km
    velocity_km_s = request.velocity_km_s
    angle = request.angle
    density_kg_m3 = request.density_kg_m3
    
    # Kütle hesaplama
    radius_m = (diameter_km * 1000) / 2
    volume_m3 = (4/3) * np.pi * (radius_m ** 3)
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
    crater_diameter_km = 0.0012 * (diameter_km ** 0.78) * (velocity_km_s ** 0.44) * (density_kg_m3/2500) ** 0.33
    
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

@app.post("/api/mitigate")
async def evaluate_mitigation(request: MitigationRequest):
    """Azaltma stratejilerini değerlendir"""
    
    diameter_km = request.diameter_km
    velocity_km_s = request.velocity_km_s
    years_before = request.years_before_impact
    method = request.method
    
    # Kütle hesaplama
    radius_m = (diameter_km * 1000) / 2
    volume_m3 = (4/3) * np.pi * (radius_m ** 3)
    mass_kg = volume_m3 * 3000
    
    if method == "kinetic_impactor":
        # Momentum transferi ile hız değişimi
        # Tipik bir kinetic impactor: 500 kg, 10 km/s
        impactor_mass = 500
        impactor_velocity = 10000  # m/s
        
        # Momentum korunumu ve beta faktörü (momentum enhancement)
        beta = 2.0  # Tipik değer
        delta_v = beta * (impactor_mass * impactor_velocity) / mass_kg
        
        # Yörünge sapması (basitleştirilmiş)
        # Δr = Δv * t
        deflection_distance_km = (delta_v * years_before * 365 * 24 * 3600) / 1000
        
        # Başarı olasılığı
        success_probability = min(95, years_before * 15 + deflection_distance_km / 1000)
        
        return {
            "method": "Kinetic Impactor",
            "delta_v_m_s": round(delta_v, 4),
            "deflection_distance_km": round(deflection_distance_km, 0),
            "success_probability": round(success_probability, 1),
            "mission_cost_billion_usd": round(0.5 + years_before * 0.1, 2),
            "success": deflection_distance_km > 6371,  # Earth radius
            "time_required_years": years_before,
            "description": f"A 500 kg impactor would deflect the asteroid by {round(deflection_distance_km, 0)} km"
        }
    
    elif method == "gravity_tractor":
        # Yerçekimi çekici (uzun süreli)
        required_years = max(10, diameter_km * 5)
        
        success = years_before >= required_years
        success_probability = min(90, (years_before / required_years) * 100)
        
        return {
            "method": "Gravity Tractor",
            "required_years": round(required_years, 1),
            "success_probability": round(success_probability, 1),
            "mission_cost_billion_usd": round(years_before * 0.2, 2),
            "success": success,
            "time_required_years": years_before,
            "description": f"Requires at least {required_years} years for this asteroid size"
        }
    
    else:
        raise HTTPException(status_code=400, detail="Unknown mitigation method")

def get_severity_level(megatons):
    """Etki şiddet seviyesi"""
    if megatons < 0.01:
        return "Minimal - Local damage only"
    elif megatons < 1:
        return "Moderate - City-scale destruction"
    elif megatons < 100:
        return "Severe - Regional catastrophe"
    elif megatons < 10000:
        return "Catastrophic - Continental damage"


    else:
        return "Extinction-level event"

def get_earthquake_description(magnitude):
    """Deprem büyüklüğü açıklaması"""
    if magnitude < 4:
        return "Minor - Often felt, rarely causes damage"
    elif magnitude < 5:
        return "Light - Noticeable shaking, slight damage"
    elif magnitude < 6:
        return "Moderate - Can cause damage to buildings"
    elif magnitude < 7:
        return "Strong - Serious damage over large areas"
    elif magnitude < 8:
        return "Major - Widespread heavy damage"
    else:
        return "Great - Catastrophic destruction"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

def asteroid_orbital(Request: ImpactRequest):
    distanceOfAsteroid = 4*math.sin(Request.angle)
    while distanceOfAsteroid > 0:
        distanceOfAsteroid -= 0.1
        time.sleep(0.1)
        return {"Asteroid_distance": distanceOfAsteroid ,
                "Asteroid_impact": False}
    return {"Asteroid_distance": distanceOfAsteroid ,
                "Asteroid_impact": True}
