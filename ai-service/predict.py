import sys
import json
import joblib
import pandas as pd
import os

def predict():
    try:
        input_data = json.loads(sys.argv[1])
    except (IndexError, json.JSONDecodeError):
        print(json.dumps({"error": "Invalid or missing JSON input"}))
        return

    model_path = os.path.join(os.path.dirname(__file__), 'models/flood_model.joblib')
    features_path = os.path.join(os.path.dirname(__file__), 'models/feature_names.joblib')

    try:
        clf = joblib.load(model_path)
        feature_names = joblib.load(features_path)
    except Exception as e:
        print(json.dumps({"error": f"Model loading failed: {str(e)}"}))
        return

    # Create a DataFrame with zeros for all required features, using float to avoid LossySetitemError
    df = pd.DataFrame(0.0, index=[0], columns=feature_names)

    # Map input data to the feature columns expected by the model
    # Matching the dataset columns based on the input
    if 'Rainfall (mm)' in df.columns:
        df.loc[0, 'Rainfall (mm)'] = input_data.get('rainfall', 0)
    if 'Water Level (m)' in df.columns:
        df.loc[0, 'Water Level (m)'] = input_data.get('river_level', 0)
    if 'Elevation (m)' in df.columns:
        df.loc[0, 'Elevation (m)'] = input_data.get('elevation', 0)
    
    # Optional: map soil moisture to humidity as a proxy if needed
    if 'Humidity (%)' in df.columns:
        df.loc[0, 'Humidity (%)'] = input_data.get('soil_moisture', 0)

    try:
        prob = clf.predict_proba(df)[0][1]
    except Exception as e:
        print(json.dumps({"error": f"Prediction failed: {str(e)}"}))
        return
    
    risk_level = "LOW"
    if prob > 0.8:
        risk_level = "CRITICAL"
    elif prob > 0.6:
        risk_level = "HIGH"
    elif prob > 0.3:
        risk_level = "MODERATE"

    result = {
        "flood_probability": float(prob),
        "risk_level": risk_level
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    predict()
