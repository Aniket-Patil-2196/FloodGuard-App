from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import joblib
import pandas as pd
import os
import logging

app = FastAPI(title="FloodGuard AI Service")
logging.basicConfig(level=logging.INFO)

clf = None
feature_names = None

class PredictionInput(BaseModel):
    rainfall: float
    river_level: float
    elevation: float
    soil_moisture: float
    slope: float

@app.on_event("startup")
def load_model():
    global clf, feature_names
    model_path = os.path.join(os.path.dirname(__file__), 'models/flood_model.joblib')
    features_path = os.path.join(os.path.dirname(__file__), 'models/feature_names.joblib')
    try:
        clf = joblib.load(model_path)
        feature_names = joblib.load(features_path)
        logging.info("Model loaded successfully into memory.")
    except Exception as e:
        logging.error(f"Failed to load model: {e}")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "FloodGuard AI Service is active", "model_loaded": clf is not None}

@app.post("/predict")
def predict(data: PredictionInput):
    if clf is None or feature_names is None:
        raise HTTPException(status_code=503, detail="Model is not loaded or unavailable")
    
    df = pd.DataFrame(0.0, index=[0], columns=feature_names)
    
    if 'Rainfall (mm)' in df.columns:
        df.loc[0, 'Rainfall (mm)'] = data.rainfall
    if 'Water Level (m)' in df.columns:
        df.loc[0, 'Water Level (m)'] = data.river_level
    if 'Elevation (m)' in df.columns:
        df.loc[0, 'Elevation (m)'] = data.elevation
    if 'Humidity (%)' in df.columns:
        df.loc[0, 'Humidity (%)'] = data.soil_moisture
        
    try:
        prob = float(clf.predict_proba(df)[0][1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")
        
    risk_level = "LOW"
    if prob > 0.8:
        risk_level = "CRITICAL"
    elif prob > 0.6:
        risk_level = "HIGH"
    elif prob > 0.3:
        risk_level = "MODERATE"
        
    return {
        "flood_probability": prob,
        "risk_level": risk_level
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, log_level="info")
