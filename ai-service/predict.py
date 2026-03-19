import numpy as np

def predict_flood(rainfall, river_level, elevation, soil_moisture, slope):
    # Mocking the RandomForest model for the demo
    # In a real scenario, we would load a trained model using joblib
    
    # Simple heuristic for flood probability
    # Higher rainfall and river level increase risk
    # Lower elevation and slope increase risk
    
    score = (rainfall * 0.3) + (river_level * 0.4) + (soil_moisture * 0.2) - (elevation * 0.01) - (slope * 0.05)
    
    # Normalize score to 0-1
    probability = 1 / (1 + np.exp(-score/10))
    
    risk_level = "LOW"
    if probability > 0.8:
        risk_level = "CRITICAL"
    elif probability > 0.6:
        risk_level = "HIGH"
    elif probability > 0.3:
        risk_level = "MODERATE"
        
    return {
        "flood_probability": float(probability),
        "risk_level": risk_level
    }
