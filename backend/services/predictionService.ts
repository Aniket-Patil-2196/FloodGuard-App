import axios from 'axios';

export const predictFlood = async (rainfall: number, river_level: number, elevation: number, soil_moisture: number, slope: number) => {
    // If running locally without the python service deployed yet, default to localhost
    let aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
    if (!aiServiceUrl.startsWith('http')) {
        aiServiceUrl = `https://${aiServiceUrl}`;
    }
    
    try {
        const response = await axios.post(`${aiServiceUrl}/predict`, {
            rainfall,
            river_level,
            elevation,
            soil_moisture,
            slope
        });
        
        return response.data;
    } catch (error: any) {
        console.error("Failed to execute prediction API:", error.response?.data || error.message);
        return { flood_probability: 0, risk_level: "LOW" };
    }
};
