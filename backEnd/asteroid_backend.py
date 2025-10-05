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
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI(title="Asteroid Impact Simulator API")

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NASA_API_KEY = os.getenv("NASA_API_KEY", "API_KEY")
NASA_BASE_URL = "https://api.nasa.gov/neo/rest/v1"
# print(NASA_API_KEY)
# print(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Request/Response modelleri
class ImpactRequest(BaseModel):
    diameter_km: float
    velocity_km_s: float
    impact_angle: float = 45
    impact_latitude: float = 0
    impact_longitude: float = 0
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
                asteroid_velocity = calculate_asteroid_velocity(neo)
                asteroids.append({
                    "id": neo["id"],
                    "name": neo["name"].replace("(", "").replace(")", ""),
                    "diameter_km": round(neo["estimated_diameter"]["kilometers"]["estimated_diameter_max"], 3),
                    "diameter_min_km": round(neo["estimated_diameter"]["kilometers"]["estimated_diameter_min"], 3),
                    # "velocity_km_s": round(float(close_approach["relative_velocity"]["kilometers_per_second"]), 2),
                    # "velocity_km_s": calculate_asteroid_velocity(neo),
                    "horizontal_velocity_km_s": asteroid_velocity["vx"],
                    "vertical_velocity_km_s": asteroid_velocity["vy"],
                    "z_velocity_km_s": asteroid_velocity["vz"],
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
            "count": 24,
            "asteroids": [
                {
                "id": "2418198",
                "name": "418198 2008 CN70",
                "diameter_km": 0.968,
                "diameter_min_km": 0.433,
                "horizontal_velocity_km_s": 8.001,
                "vertical_velocity_km_s": 8.292,
                "z_velocity_km_s": 13.757,
                "miss_distance_km": 45709342,
                "close_approach_date": "2025-09-29",
                "is_potentially_hazardous": False
                },
                {
                "id": "2319988",
                "name": "319988 2007 DK",
                "diameter_km": 0.766,
                "diameter_min_km": 0.342,
                "horizontal_velocity_km_s": -10.595,
                "vertical_velocity_km_s": 8.261,
                "z_velocity_km_s": -4.846,
                "miss_distance_km": 19650689,
                "close_approach_date": "2025-10-05",
                "is_potentially_hazardous": False
                },
                {
                "id": "2247517",
                "name": "247517 2002 QY6",
                "diameter_km": 0.702,
                "diameter_min_km": 0.314,
                "horizontal_velocity_km_s": 15.218,
                "vertical_velocity_km_s": 3.476,
                "z_velocity_km_s": 9.538,
                "miss_distance_km": 20515576,
                "close_approach_date": "2025-10-05",
                "is_potentially_hazardous": False
                },
                {
                "id": "2152664",
                "name": "152664 1998 FW4",
                "diameter_km": 0.689,
                "diameter_min_km": 0.308,
                "horizontal_velocity_km_s": -12.788,
                "vertical_velocity_km_s": -12.703,
                "z_velocity_km_s": -4.616,
                "miss_distance_km": 3852719,
                "close_approach_date": "2025-09-29",
                "is_potentially_hazardous": True
                },
                {
                "id": "3789115",
                "name": "2017 VV1",
                "diameter_km": 0.54,
                "diameter_min_km": 0.241,
                "horizontal_velocity_km_s": -12.062,
                "vertical_velocity_km_s": -2.1,
                "z_velocity_km_s": -17.684,
                "miss_distance_km": 29445959,
                "close_approach_date": "2025-09-30",
                "is_potentially_hazardous": False
                },
                {
                "id": "3557843",
                "name": "2011 DV",
                "diameter_km": 0.413,
                "diameter_min_km": 0.185,
                "horizontal_velocity_km_s": 0.712,
                "vertical_velocity_km_s": 4.284,
                "z_velocity_km_s": 4.299,
                "miss_distance_km": 22164403,
                "close_approach_date": "2025-09-28",
                "is_potentially_hazardous": True
                },
                {
                "id": "3346460",
                "name": "2006 SS134",
                "diameter_km": 0.301,
                "diameter_min_km": 0.134,
                "horizontal_velocity_km_s": -4.619,
                "vertical_velocity_km_s": 18.372,
                "z_velocity_km_s": 0.913,
                "miss_distance_km": 12154759,
                "close_approach_date": "2025-10-01",
                "is_potentially_hazardous": True
                },
                {
                "id": "3427459",
                "name": "2008 SS",
                "diameter_km": 0.218,
                "diameter_min_km": 0.097,
                "horizontal_velocity_km_s": -10.779,
                "vertical_velocity_km_s": 5.09,
                "z_velocity_km_s": 8.305,
                "miss_distance_km": 17860589,
                "close_approach_date": "2025-10-03",
                "is_potentially_hazardous": False
                },
                {
                "id": "3781988",
                "name": "2017 SJ20",
                "diameter_km": 0.202,
                "diameter_min_km": 0.09,
                "horizontal_velocity_km_s": 15.577,
                "vertical_velocity_km_s": 8.68,
                "z_velocity_km_s": -19.093,
                "miss_distance_km": 56731410,
                "close_approach_date": "2025-10-02",
                "is_potentially_hazardous": False
                },
                {
                "id": "3716631",
                "name": "2015 HN9",
                "diameter_km": 0.179,
                "diameter_min_km": 0.08,
                "horizontal_velocity_km_s": -6.329,
                "vertical_velocity_km_s": 0.212,
                "z_velocity_km_s": -4.395,
                "miss_distance_km": 12307670,
                "close_approach_date": "2025-10-03",
                "is_potentially_hazardous": False
                },
                {
                "id": "3648537",
                "name": "2013 ST19",
                "diameter_km": 0.177,
                "diameter_min_km": 0.079,
                "horizontal_velocity_km_s": 9.245,
                "vertical_velocity_km_s": -7.33,
                "z_velocity_km_s": -2.02,
                "miss_distance_km": 18915604,
                "close_approach_date": "2025-09-28",
                "is_potentially_hazardous": False
                },
                {
                "id": "3782063",
                "name": "2017 TG1",
                "diameter_km": 0.156,
                "diameter_min_km": 0.07,
                "horizontal_velocity_km_s": 11.846,
                "vertical_velocity_km_s": -2.794,
                "z_velocity_km_s": 8.899,
                "miss_distance_km": 44783877,
                "close_approach_date": "2025-10-02",
                "is_potentially_hazardous": False
                },
                {
                "id": "3728859",
                "name": "2015 SZ16",
                "diameter_km": 0.156,
                "diameter_min_km": 0.07,
                "horizontal_velocity_km_s": 3.74,
                "vertical_velocity_km_s": 5.904,
                "z_velocity_km_s": 8.516,
                "miss_distance_km": 58516117,
                "close_approach_date": "2025-10-04",
                "is_potentially_hazardous": False
                },
                {
                "id": "3730802",
                "name": "2015 TT238",
                "diameter_km": 0.071,
                "diameter_min_km": 0.032,
                "horizontal_velocity_km_s": -0.617,
                "vertical_velocity_km_s": 7.087,
                "z_velocity_km_s": -0.857,
                "miss_distance_km": 13734684,
                "close_approach_date": "2025-10-01",
                "is_potentially_hazardous": False
                },
                {
                "id": "54214066",
                "name": "2021 UK6",
                "diameter_km": 0.058,
                "diameter_min_km": 0.026,
                "horizontal_velocity_km_s": 13.106,
                "vertical_velocity_km_s": -11.795,
                "z_velocity_km_s": 9.031,
                "miss_distance_km": 60303062,
                "close_approach_date": "2025-09-29",
                "is_potentially_hazardous": False
                }
            ]
            }

# -----------------------------
# Helpers
# -----------------------------
def kinetic_energy(mass, velocity):
    return 0.5 * mass * velocity**2


def crater_diameter(diameter_m, velocity_m_s, density, angle_deg):
    g = 9.81
    theta = math.radians(angle_deg)
    mass = (4/3) * math.pi * (diameter_m/2)**3 * density
    E = kinetic_energy(mass, velocity_m_s)
    d_crater = 1.161 * (E**0.294) * (math.sin(theta)**(1/3)) / (g**0.22)
    depth = d_crater * 0.2
    return d_crater, depth


def blast_radius(E):
    return 0.28 * (E ** (1/3)) / 1000  # km


def thermal_radius(E):
    # very rough threshold for severe burns
    return 0.05 * (E ** (1/3)) / 1000  # km


def tsunami_risk(height_m):
    if height_m > 20:
        return "high"
    elif height_m > 5:
        return "moderate"
    else:
        return "low"


def tsunami_height(diameter_m, velocity_m_s, angle_deg, distance_km):
    theta = math.radians(angle_deg)
    impact_energy = kinetic_energy((4/3)*math.pi*(diameter_m/2)**3*3000, velocity_m_s)
    h0 = 0.1 * (impact_energy**0.25) / 1e6
    return h0 / (1 + distance_km/50)


def seismic_magnitude(E):
    return (math.log10(E) - 4.8) / 1.5


def tsunami_risk_new(latitude, longitude, earthquake_magnitude):
    # Tsunami riski (okyanusa düşerse)
    ocean = (((60,-60),(120,-80)),((60,-90),(180,-180)),((90,60),(180,-180)),((30,-60),(20,120)),((70,-60),(20,-80)))
    for ((low_latitude,high_latitude),(low_longitude,high_longitude)) in ocean:
        if high_latitude < latitude < low_latitude and high_longitude < abs(longitude) < low_longitude:
            if earthquake_magnitude > 7.6:
                return "high"
            elif earthquake_magnitude > 6.8:
                return "moderate"
            else:
                return "low"
        else:
            return "low"

# -----------------------------
# API Endpoint
# -----------------------------
@app.post("/api/simulate")
async def simulate_impact(request: ImpactRequest):
    try:
        # Convert units
        diameter_m = request.diameter_km * 1000
        velocity_m_s = request.velocity_km_s * 1000
        theta = math.radians(request.impact_angle)
        density = request.density_kg_m3 or 2500 # Assuming an average density of an asteroid is 2500 kg/m^3, if not provided

        # Mass & energy
        mass = (4/3) * math.pi * (diameter_m/2)**3 * density
        E = kinetic_energy(mass, velocity_m_s)

        # Megaton TNT conversion (1 MT TNT = 4.184e15 J)
        megatons = E / 4.184e15
        kilotons = megatons * 1000

        # Calculations
        crater_diam, crater_depth = crater_diameter(diameter_m, velocity_m_s, density, request.impact_angle)
        blast = blast_radius(E)
        thermal = thermal_radius(E)
        tsunami_h = tsunami_height(diameter_m, velocity_m_s, request.impact_angle, 100)
        magnitude = seismic_magnitude(E)

        # Classification of severity
        if megatons > 1e6:
            severity = "Extinction Level Event"
        elif megatons > 1e3:
            severity = "Catastrophic Global Impact"
        elif megatons > 100:
            severity = "Severe Regional Impact"
        else:
            severity = "Localized Impact"

        hiroshima_equiv = round(megatons * 1000 / 15, 2)  # Hiroshima ~15 kt

        # -----------------------------
        # Build response in React format
        # -----------------------------
        return {
            "impact_energy": {
                "megatons": round(megatons, 2),
                "kilotons": round(kilotons, 2)
            },
            "crater": {
                "diameter_km": round(crater_diam / 1000, 2),
                "depth_km": round(crater_depth / 10000, 2),
                "airburst": diameter_m <= 100  # arbitrary threshold
            },
            "seismic": {
                "magnitude": round(magnitude, 1),
                "description": f"Equivalent to magnitude {round(magnitude,1)} earthquake"
            },
            "damage_zones": {
                "blast_radius_km": round(blast, 1),
                "thermal_radius_km": round(thermal, 1),
                # "tsunami_risk": tsunami_risk(tsunami_h)
                "tsunami_risk": tsunami_risk_new(request.impact_latitude, request.impact_longitude, magnitude)
            },
            "comparison": {
                "severity": severity,
                "hiroshima_equivalent": hiroshima_equiv
            },
            "asteroid_params": {
                "mass_kg": mass,
                "diameter_km": request.diameter_km,
                "velocity_km_s": request.velocity_km_s,
                "angle_degrees": request.impact_angle
            },
            "impact_location": {
                "latitude": request.impact_latitude,
                "longitude": request.impact_longitude
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    
import numpy as np
from astropy.time import Time
import astropy.units as u

def calculate_asteroid_velocity(api_data):
    try:
        close_approach = api_data["close_approach_data"][0]
        velocity_kms = float(close_approach["relative_velocity"]["kilometers_per_second"])
        miss_distance_km = float(close_approach["miss_distance"]["kilometers"])
    except (KeyError, IndexError, ValueError) as e:
        raise ValueError("Invalid API data format. Ensure 'close_approach_data' contains required fields.")

    # Random position on a sphere with radius = miss_distance_km
    phi = np.random.uniform(0, 2 * np.pi)  # Azimuthal angle
    theta = np.random.uniform(0, np.pi)     # Polar angle
    pos_x = miss_distance_km * np.sin(theta) * np.cos(phi)
    pos_y = miss_distance_km * np.sin(theta) * np.sin(phi)
    pos_z = miss_distance_km * np.cos(theta)
    position = np.array([pos_x, pos_y, pos_z])

    # Velocity: Assume perpendicular to position in a random orbital plane
    # Generate a random vector not parallel to position
    while True:
        rand_vec = np.random.uniform(-1, 1, 3)
        if np.linalg.norm(np.cross(rand_vec, position)) > 1e-6:  # Ensure not parallel
            break
    # Compute velocity direction perpendicular to position
    vel_dir = np.cross(position, rand_vec)
    vel_dir = vel_dir / np.linalg.norm(vel_dir)  # Normalize
    velocity = vel_dir * velocity_kms

    # Ensure Z-positive toward Earth (radial velocity check)
    radial_vel = -np.dot(velocity, position / np.linalg.norm(position))
    if radial_vel < 0:
        velocity = -velocity

    return {
        "vx": round(velocity[0], 3),
        "vy": round(velocity[1], 3),
        "vz": round(velocity[2], 3)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
