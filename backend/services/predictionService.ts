
export const predictFlood = (rainfall: number, river_level: number, elevation: number, soil_moisture: number, slope: number) => {
    // Ported from ai-service/predict.py
    // Simple heuristic for flood probability
    // Higher rainfall and river level increase risk
    // Lower elevation and slope increase risk
    
    const score = (rainfall * 0.3) + (river_level * 0.4) + (soil_moisture * 0.2) - (elevation * 0.01) - (slope * 0.05);
    
    // Normalize score to 0-1 using sigmoid-like function
    const probability = 1 / (1 + Math.exp(-score / 10));
    
    let risk_level = "LOW";
    if (probability > 0.8) {
        risk_level = "CRITICAL";
    } else if (probability > 0.6) {
        risk_level = "HIGH";
    } else if (probability > 0.3) {
        risk_level = "MODERATE";
    }
        
    return {
        flood_probability: probability,
        risk_level: risk_level
    };
};
