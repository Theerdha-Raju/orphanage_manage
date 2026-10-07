"""
ML Pipeline for HopeNest Intelligent Orphanage Management System
Separated training script for:
1. Academic Performance & Risk Prediction (Random Forest)
2. Pediatric Health Risk Detection (Support Vector Machine)
3. Behaviour & Social Adjustment (K-Nearest Neighbors)

Saves trained models to backend/api/ml_models/
"""

import os
import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), 'ml_models')
os.makedirs(MODELS_DIR, exist_ok=True)

def train_academic_models():
    print("Training Academic Performance & Risk Models...")
    np.random.seed(42)
    n_samples = 600

    # Features: [attendance_pct (30-100), avg_past_score (20-100), assignment_avg (20-100), internal_avg (20-100), trend (-20 to +20)]
    attendance = np.random.uniform(40, 100, n_samples)
    past_score = np.random.uniform(35, 98, n_samples)
    assignment = np.clip(past_score + np.random.normal(2, 5, n_samples), 30, 100)
    internal = np.clip(past_score + np.random.normal(-1, 6, n_samples), 25, 100)
    trend = np.random.uniform(-15, 15, n_samples)

    X = np.column_stack([attendance, past_score, assignment, internal, trend])

    # Target continuous score (0-100)
    y_score = (
        0.25 * attendance +
        0.35 * past_score +
        0.15 * assignment +
        0.20 * internal +
        0.50 * trend +
        np.random.normal(0, 3, n_samples)
    )
    y_score = np.clip(y_score, 10.0, 99.5)

    # Risk level target:
    # 0 = Low Risk (predicted score >= 70 and attendance >= 75)
    # 1 = Moderate Risk (predicted score 50-69 or attendance 60-74)
    # 2 = High Risk (predicted score < 50 or attendance < 60)
    y_risk = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        if y_score[i] < 50 or attendance[i] < 60:
            y_risk[i] = 2 # High Risk
        elif y_score[i] < 70 or attendance[i] < 75:
            y_risk[i] = 1 # Moderate Risk
        else:
            y_risk[i] = 0 # Low Risk

    # 1a. Regressor for exact projected score
    regressor = RandomForestRegressor(n_estimators=120, max_depth=8, random_state=42)
    regressor.fit(X, y_score)
    joblib.dump(regressor, os.path.join(MODELS_DIR, 'academic_regressor.joblib'))

    # 1b. Classifier for risk level
    classifier = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42)
    classifier.fit(X, y_risk)
    joblib.dump(classifier, os.path.join(MODELS_DIR, 'academic_risk_classifier.joblib'))
    print("Academic models saved.")

def train_health_model():
    print("Training Pediatric Health Risk Model...")
    np.random.seed(42)
    n_samples = 500

    # Features: [bmi (11.0 to 32.0), height_ratio (0.75 to 1.25), checkup_gap_months (1 to 18), sick_days (0 to 15)]
    bmi = np.random.uniform(12.0, 30.0, n_samples)
    height_ratio = np.random.uniform(0.85, 1.15, n_samples)
    gap_months = np.random.uniform(1, 12, n_samples)
    sick_days = np.random.poisson(2, n_samples)

    X = np.column_stack([bmi, height_ratio, gap_months, sick_days])

    # Target: 0 = Low Risk (Normal), 1 = Moderate Risk, 2 = High Risk
    y_health = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        b = bmi[i]
        sd = sick_days[i]
        gm = gap_months[i]
        if b < 13.5 or b > 27.0 or sd > 7 or gm > 9:
            y_health[i] = 2 # High Risk
        elif b < 15.5 or b > 23.5 or sd >= 3 or gm > 5:
            y_health[i] = 1 # Moderate Risk
        else:
            y_health[i] = 0 # Low Risk

    pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('svm', SVC(kernel='rbf', probability=True, C=1.5, random_state=42))
    ])
    pipe.fit(X, y_health)
    joblib.dump(pipe, os.path.join(MODELS_DIR, 'health_risk_svm.joblib'))
    print("Health model saved.")

def train_behavior_model():
    print("Training Behaviour & Social Adjustment Model...")
    np.random.seed(42)
    n_samples = 450

    # Features: [incident_count (0 to 10), interaction_score (1 to 10), participation_score (1 to 10), activities_count (0 to 8)]
    incidents = np.random.poisson(1.2, n_samples)
    interaction = np.clip(np.random.normal(7.5, 2.0, n_samples), 1.0, 10.0)
    participation = np.clip(np.random.normal(7.0, 2.2, n_samples), 1.0, 10.0)
    activities = np.random.poisson(2.5, n_samples)

    X = np.column_stack([incidents, interaction, participation, activities])

    # Target: 0 = Positive / Stable, 1 = Moderate Guidance Needed, 2 = Intervention / Caregiver Review
    y_behav = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        inc = incidents[i]
        inter = interaction[i]
        part = participation[i]
        if inc >= 4 or inter < 4.0 or part < 3.5:
            y_behav[i] = 2 # Intervention
        elif inc >= 2 or inter < 6.0 or part < 5.5:
            y_behav[i] = 1 # Needs Encouragement
        else:
            y_behav[i] = 0 # Positive/Stable

    pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('knn', KNeighborsClassifier(n_neighbors=5, weights='distance'))
    ])
    pipe.fit(X, y_behav)
    joblib.dump(pipe, os.path.join(MODELS_DIR, 'behavior_knn.joblib'))
    print("Behaviour model saved.")

if __name__ == '__main__':
    train_academic_models()
    train_health_model()
    train_behavior_model()
    print("All ML models trained and saved to backend/api/ml_models/ successfully.")
