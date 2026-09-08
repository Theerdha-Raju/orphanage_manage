import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression

class MLEngine:
    def __init__(self):
        # 1. Random Forest: Academic Performance
        # Features: [Attendance %, Previous Score, Study Hours/Week]
        # Classes: 0 (C/Fail), 1 (B/Average), 2 (A/Excellent)
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        X_acad = np.array([[50, 40, 2], [60, 50, 4], [75, 70, 8], [90, 85, 12], [95, 90, 15], [98, 95, 20]])
        y_acad = np.array([0, 0, 1, 2, 2, 2])
        self.rf_model.fit(X_acad, y_acad)

        # 2. SVM: Health Risk Detection
        # Features: [BMI, Sick Days]
        # Classes: 0 (Low Risk), 1 (Medium Risk), 2 (High Risk)
        self.svm_model = SVC(probability=True, random_state=42)
        X_health = np.array([[18, 0], [20, 1], [15, 5], [25, 4], [14, 10], [30, 8]])
        y_health = np.array([0, 0, 1, 1, 2, 2])
        self.svm_model.fit(X_health, y_health)

        # 3. KNN: Behavior Classification
        # Features: [Incidents, Social Interaction Score]
        # Classes: 0 (Stable), 1 (Needs Attention)
        self.knn_model = KNeighborsClassifier(n_neighbors=3)
        X_behav = np.array([[0, 9], [1, 8], [3, 5], [5, 2], [0, 10], [4, 4]])
        y_behav = np.array([0, 0, 1, 1, 0, 1])
        self.knn_model.fit(X_behav, y_behav)

        # 4. Logistic Regression: Growth Prediction
        # Features: [Age, Current Height, Current Weight]
        # Classes: 0 (Below Avg Growth), 1 (Normal Growth)
        self.log_reg = LogisticRegression(random_state=42)
        X_growth = np.array([[5, 105, 18], [8, 125, 24], [10, 138, 32], [5, 95, 14], [8, 110, 18], [10, 120, 25]])
        y_growth = np.array([1, 1, 1, 0, 0, 0])
        self.log_reg.fit(X_growth, y_growth)

    def predict_academic(self, attendance, prev_score, study_hours):
        input_data = np.array([[attendance, prev_score, study_hours]])
        prediction = self.rf_model.predict(input_data)[0]
        probs = self.rf_model.predict_proba(input_data)[0]
        confidence = max(probs)
        
        # Calculate a predicted numerical score
        base_score = (attendance * 0.4) + (prev_score * 0.4) + (study_hours * 0.8)
        predicted_score = min(100, max(0, round(base_score)))
        
        grade_map = {0: "C/Needs Improvement", 1: "B/Good", 2: "A/Excellent"}
        return {
            "predicted_score": predicted_score,
            "predicted_grade": grade_map[prediction],
            "confidence": round(confidence * 100, 2)
        }

    def predict_health(self, bmi, sick_days):
        input_data = np.array([[bmi, sick_days]])
        prediction = self.svm_model.predict(input_data)[0]
        probs = self.svm_model.predict_proba(input_data)[0]
        confidence = max(probs)
        
        risk_map = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}
        return {
            "risk_level": risk_map[prediction],
            "confidence": round(confidence * 100, 2)
        }

    def predict_behavior(self, incidents, interaction_score):
        input_data = np.array([[incidents, interaction_score]])
        prediction = self.knn_model.predict(input_data)[0]
        probs = self.knn_model.predict_proba(input_data)[0]
        confidence = max(probs)
        
        status_map = {0: "Stable/Positive", 1: "Needs Caregiver Attention"}
        return {
            "behavior_status": status_map[prediction],
            "confidence": round(confidence * 100, 2)
        }

    def predict_growth(self, age, height, weight):
        input_data = np.array([[age, height, weight]])
        prediction = self.log_reg.predict(input_data)[0]
        probs = self.log_reg.predict_proba(input_data)[0]
        confidence = max(probs)
        
        growth_map = {0: "Below Average - Consult Nutritionist", 1: "Normal Growth Trajectory"}
        return {
            "growth_forecast": growth_map[prediction],
            "confidence": round(confidence * 100, 2)
        }

# Global singleton instance
ml_engine = MLEngine()
