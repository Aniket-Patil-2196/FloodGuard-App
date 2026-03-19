from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import job_lib
import numpy as np
import os
from predict import predict_flood

app = FastAPI()

class PredictionInput(BaseModel):
    rainfall: float
    river_level: float
    elevation: float
    soil_moisture: float
    slope: float

@app.get("/")
def read_root():
    return {"message": "Flood Prediction AI Service is running"}

@app.post("/predict")
def predict(data: PredictionInput):
    result = predict_flood(
        data.rainfall, 
        data.river_level, 
        data.elevation, 
        data.soil_moisture, 
        data.slope
    )
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
