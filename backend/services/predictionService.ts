import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

export const predictFlood = async (rainfall: number, river_level: number, elevation: number, soil_moisture: number, slope: number) => {
    const inputData = JSON.stringify({ rainfall, river_level, elevation, soil_moisture, slope });
    // ai-service is at the root, services is inside backend/services
    const scriptPath = path.join(__dirname, '../../ai-service/predict.py');
    
    try {
        // Use double quotes around the JSON for Windows command line compatibility
        // Escape inner double quotes
        const escapedJson = inputData.replace(/"/g, '\\"');
        const { stdout } = await execPromise(`python "${scriptPath}" "${escapedJson}"`);
        
        try {
            const result = JSON.parse(stdout.trim());
            if (result.error) {
                console.error("Prediction script error:", result.error);
                return { flood_probability: 0, risk_level: "LOW" };
            }
            return result;
        } catch (parseError) {
            console.error("Failed to parse prediction output:", stdout);
            return { flood_probability: 0, risk_level: "LOW" };
        }
    } catch (error) {
        console.error("Failed to execute prediction script:", error);
        return { flood_probability: 0, risk_level: "LOW" };
    }
};
