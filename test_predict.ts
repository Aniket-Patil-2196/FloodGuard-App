import { predictFlood } from './backend/services/predictionService.ts';

async function testPrediction() {
    console.log("Testing predictFlood service...");
    const result = await predictFlood(
        150.5, // rainfall
        6.2,   // river_level
        350.0, // elevation
        60.0,  // soil_moisture
        5.0    // slope
    );
    console.log("Prediction Result:", result);
}

testPrediction();
