import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import joblib
import os

# Create models directory if it doesn't exist
os.makedirs('models', exist_ok=True)

# 1. Load and inspect dataset
print("Loading dataset...")
data_path = 'data/flood_risk_dataset_india.csv'
df = pd.read_csv(data_path)

print("\n--- Dataset Inspection ---")
print(f"Shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")
print("\nMissing Values:")
print(df.isnull().sum())

target_col = 'Flood Occurred'
print(f"\nClass Distribution of '{target_col}':")
print(df[target_col].value_counts())

# 2. Handle missing values if any (fill numeric with median, categorical with mode)
for col in df.columns:
    if pd.api.types.is_numeric_dtype(df[col]):
        df[col] = df[col].fillna(df[col].median())
    else:
        df[col] = df[col].fillna(df[col].mode()[0])

# 3. Handle categorical columns
# We will use one-hot encoding for categorical variables
print("\nHandling categorical columns...")
categorical_cols = ['Land Cover', 'Soil Type']
# Ensure they exist in columns before encoding
categorical_cols = [c for c in categorical_cols if c in df.columns]

df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

# 4. Prepare features and target
X = df_encoded.drop(columns=[target_col])
y = df_encoded[target_col]

# Save the feature names for prediction later
feature_names = X.columns.tolist()
joblib.dump(feature_names, 'models/feature_names.joblib')

# 5. Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 6. Train RandomForestClassifier
print("\nTraining RandomForestClassifier...")
clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
clf.fit(X_train, y_train)

# 7. Evaluate Model
print("\n--- Model Evaluation ---")
y_pred = clf.predict(X_test)
y_prob = clf.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_prob)
conf_matrix = confusion_matrix(y_test, y_pred)

print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1 Score:  {f1:.4f}")
print(f"ROC-AUC:   {roc_auc:.4f}")
print("Confusion Matrix:")
print(conf_matrix)

# 8. Feature Importance
print("\n--- Feature Importance ---")
feature_importances = pd.DataFrame({'Feature': X.columns, 'Importance': clf.feature_importances_})
feature_importances = feature_importances.sort_values(by='Importance', ascending=False)
print(feature_importances.head(10))

# 9. Save trained model
model_path = 'models/flood_model.joblib'
joblib.dump(clf, model_path)
print(f"\nModel saved successfully to {model_path}")
print("Training complete!")
