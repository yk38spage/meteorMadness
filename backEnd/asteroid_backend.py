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

# NASA_API_KEY = os.getenv("uIHWZOg9PWP25PlpgspRfbGOqOmdUchgeTXGa1Va", "uIHWZOg9PWP25PlpgspRfbGOqOmdUchgeTXGa1Va")
NASA_API_KEY = os.getenv("uIHWZOg9PWP25PlpgspRfbGOqOmdUchgeTXGa1Va", "NO_KEY")
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
                    {
                        "id": "2418198",
                        "name": "418198 2008 CN70",
                        "diameter_km": 0.968,
                        "diameter_min_km": 0.433,
                        "velocity_km_s": 17.95,
                        "miss_distance_km": 45709342.0,
                        "close_approach_date": "2025-09-29",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "2152664",
                        "name": "152664 1998 FW4",
                        "diameter_km": 0.689,
                        "diameter_min_km": 0.308,
                        "velocity_km_s": 18.61,
                        "miss_distance_km": 3852719.0,
                        "close_approach_date": "2025-09-29",
                        "is_potentially_hazardous": True
                    },
                    {
                        "id": "3002856",
                        "name": "1991 GO",
                        "diameter_km": 0.568,
                        "diameter_min_km": 0.254,
                        "velocity_km_s": 32.3,
                        "miss_distance_km": 70011872.0,
                        "close_approach_date": "2025-10-01",
                        "is_potentially_hazardous": True
                    },
                    {
                        "id": "3789115",
                        "name": "2017 VV1",
                        "diameter_km": 0.54,
                        "diameter_min_km": 0.241,
                        "velocity_km_s": 21.51,
                        "miss_distance_km": 29445959.0,
                        "close_approach_date": "2025-09-30",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "3557843",
                        "name": "2011 DV",
                        "diameter_km": 0.413,
                        "diameter_min_km": 0.185,
                        "velocity_km_s": 6.11,
                        "miss_distance_km": 22164403.0,
                        "close_approach_date": "2025-09-28",
                        "is_potentially_hazardous": True
                    },
                    {
                        "id": "3346460",
                        "name": "2006 SS134",
                        "diameter_km": 0.301,
                        "diameter_min_km": 0.134,
                        "velocity_km_s": 18.97,
                        "miss_distance_km": 12154759.0,
                        "close_approach_date": "2025-10-01",
                        "is_potentially_hazardous": True
                    },
                    {
                        "id": "3427459",
                        "name": "2008 SS",
                        "diameter_km": 0.218,
                        "diameter_min_km": 0.097,
                        "velocity_km_s": 14.53,
                        "miss_distance_km": 17860589.0,
                        "close_approach_date": "2025-10-03",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "3781988",
                        "name": "2017 SJ20",
                        "diameter_km": 0.202,
                        "diameter_min_km": 0.09,
                        "velocity_km_s": 26.13,
                        "miss_distance_km": 56731410.0,
                        "close_approach_date": "2025-10-02",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "3716631",
                        "name": "2015 HN9",
                        "diameter_km": 0.179,
                        "diameter_min_km": 0.08,
                        "velocity_km_s": 7.71,
                        "miss_distance_km": 12307670.0,
                        "close_approach_date": "2025-10-03",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "3648537",
                        "name": "2013 ST19",
                        "diameter_km": 0.177,
                        "diameter_min_km": 0.079,
                        "velocity_km_s": 11.97,
                        "miss_distance_km": 18915604.0,
                        "close_approach_date": "2025-09-28",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "3449749",
                        "name": "2009 DO111",
                        "diameter_km": 0.16,
                        "diameter_min_km": 0.072,
                        "velocity_km_s": 5.47,
                        "miss_distance_km": 18849694.0,
                        "close_approach_date": "2025-09-27",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "3782063",
                        "name": "2017 TG1",
                        "diameter_km": 0.156,
                        "diameter_min_km": 0.07,
                        "velocity_km_s": 15.08,
                        "miss_distance_km": 44783877.0,
                        "close_approach_date": "2025-10-02",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "3728859",
                        "name": "2015 SZ16",
                        "diameter_km": 0.156,
                        "diameter_min_km": 0.07,
                        "velocity_km_s": 11.02,
                        "miss_distance_km": 58516117.0,
                        "close_approach_date": "2025-10-04",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "3137735",
                        "name": "2002 TX59",
                        "diameter_km": 0.099,
                        "diameter_min_km": 0.044,
                        "velocity_km_s": 13.45,
                        "miss_distance_km": 49723080.0,
                        "close_approach_date": "2025-09-27",
                        "is_potentially_hazardous": False
                    },
                    {
                        "id": "3137864",
                        "name": "2002 TS69",
                        "diameter_km": 0.078,
                        "diameter_min_km": 0.035,
                        "velocity_km_s": 9.7,
                        "miss_distance_km": 40253357.0,
                        "close_approach_date": "2025-09-27",
                        "is_potentially_hazardous": False
                    }
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
