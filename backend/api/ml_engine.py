import os
import joblib
import numpy as np
from datetime import date, datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, 'ml_models')

class MLEngine:
    def __init__(self):
        # Load trained models from disk if present, else fallback safely
        self.acad_reg = self._load_model('academic_regressor.joblib')
        self.acad_clf = self._load_model('academic_risk_classifier.joblib')
        self.health_svm = self._load_model('health_risk_svm.joblib')
        self.behav_knn = self._load_model('behavior_knn.joblib')

    def _load_model(self, filename):
        path = os.path.join(MODELS_DIR, filename)
        if os.path.exists(path):
            try:
                return joblib.load(path)
            except Exception as e:
                print(f"Warning: Could not load {filename}: {e}")
        return None

    # =========================================================================
    # 1. ACADEMIC PREDICTION & MONITORING
    # =========================================================================
    def predict_academic_for_child(self, child_id):
        from .models import Child, Education, Attendance

        child = Child.objects.filter(pk=child_id).first()
        if not child:
            return {"status": "error", "message": f"Child with ID {child_id} not found."}

        # 1. Fetch academic records
        edu_qs = Education.objects.filter(child=child).order_by('exam_date')
        if not edu_qs.exists():
            return {
                "status": "insufficient_data",
                "child_id": child.child_id,
                "child_name": child.full_name,
                "message": "Insufficient academic exam records available to compute prediction.",
                "current_performance": "Insufficient Data",
                "predicted_performance": "Insufficient Data",
                "predicted_score": None,
                "risk_level": "Insufficient Data",
                "trend": "Insufficient Data",
                "confidence": None,
                "recommendation": "Record baseline assessment marks to enable predictive monitoring."
            }

        marks_list = [float(e.marks) for e in edu_qs if e.marks is not None]
        if not marks_list:
            return {
                "status": "insufficient_data",
                "child_id": child.child_id,
                "child_name": child.full_name,
                "message": "No numerical marks found in academic records."
            }

        avg_score = float(np.mean(marks_list))
        
        # Assignment and internal averages
        asgn_list = [float(e.assignment_marks) for e in edu_qs if e.assignment_marks is not None]
        asgn_avg = float(np.mean(asgn_list)) if asgn_list else avg_score
        
        int_list = [float(e.internal_marks) for e in edu_qs if e.internal_marks is not None]
        int_avg = float(np.mean(int_list)) if int_list else avg_score

        # Performance trend (recent marks vs earlier marks)
        if len(marks_list) >= 2:
            mid = len(marks_list) // 2
            earlier_avg = np.mean(marks_list[:mid])
            recent_avg = np.mean(marks_list[mid:])
            trend_val = recent_avg - earlier_avg
            if trend_val >= 3.0:
                trend_str = "Improving"
            elif trend_val <= -3.0:
                trend_str = "Declining"
            else:
                trend_str = "Stable"
        else:
            trend_val = 0.0
            trend_str = "Stable"

        # 2. Attendance %
        att_qs = Attendance.objects.filter(child=child)
        total_att = att_qs.count()
        if total_att > 0:
            present_att = att_qs.filter(attendance_status='Present').count()
            attendance_pct = round((present_att / total_att) * 100.0, 1)
        else:
            attendance_pct = 85.0 # Default baseline if untracked

        # 3. Model Inference
        features = np.array([[attendance_pct, avg_score, asgn_avg, int_avg, trend_val]])
        
        if self.acad_reg and self.acad_clf:
            try:
                pred_score = float(self.acad_reg.predict(features)[0])
                pred_score = min(100.0, max(0.0, round(pred_score, 1)))
                
                risk_code = int(self.acad_clf.predict(features)[0])
                probs = self.acad_clf.predict_proba(features)[0]
                confidence = round(float(np.max(probs)) * 100, 1)
            except Exception:
                pred_score = round(min(100.0, max(0.0, (avg_score * 0.7) + (attendance_pct * 0.3) + trend_val)), 1)
                risk_code = 2 if pred_score < 50 else (1 if pred_score < 70 else 0)
                confidence = 82.5
        else:
            pred_score = round(min(100.0, max(0.0, (avg_score * 0.7) + (attendance_pct * 0.3) + trend_val)), 1)
            risk_code = 2 if pred_score < 50 else (1 if pred_score < 70 else 0)
            confidence = 85.0

        risk_map = {0: "Low", 1: "Medium", 2: "High"}
        risk_level = risk_map.get(risk_code, "Medium")

        # Current performance category
        if avg_score >= 80:
            curr_perf = "Good"
        elif avg_score >= 60:
            curr_perf = "Average"
        else:
            curr_perf = "Needs Improvement"

        # Recommendations
        if risk_level == "High":
            rec = "High academic risk identified. Implement 45-minute daily remedial tutoring and weekly caregiver check-ins."
        elif risk_level == "Medium":
            rec = "Moderate academic support recommended. Strengthen practice in lower-scoring subjects and maintain study discipline."
        else:
            rec = "Strong academic trajectory. Encourage advanced reading and peer mentoring opportunities."

        return {
            "status": "success",
            "child_id": child.child_id,
            "child_name": child.full_name,
            "current_performance": curr_perf,
            "current_average": round(avg_score, 1),
            "attendance_rate": attendance_pct,
            "predicted_performance": trend_str,
            "predicted_score": pred_score,
            "risk_level": risk_level,
            "performance_trend": trend_str,
            "confidence": confidence,
            "recommendation": rec
        }

    def predict_academic(self, attendance, prev_score, study_hours=3, assignment_avg=None, internal_avg=None, trend=None):
        """Direct feature input predictor for manual testing/simulations."""
        asgn = assignment_avg if assignment_avg is not None else prev_score
        intn = internal_avg if internal_avg is not None else prev_score
        trnd = trend if trend is not None else 0.0

        features = np.array([[attendance, prev_score, asgn, intn, trnd]])
        if self.acad_reg and self.acad_clf:
            try:
                pred_score = float(self.acad_reg.predict(features)[0])
                pred_score = min(100.0, max(0.0, round(pred_score, 1)))
                risk_code = int(self.acad_clf.predict(features)[0])
                probs = self.acad_clf.predict_proba(features)[0]
                confidence = round(float(np.max(probs)) * 100, 1)
            except Exception:
                pred_score = round(min(100.0, (prev_score * 0.6) + (attendance * 0.3) + (study_hours * 1.5)), 1)
                risk_code = 2 if pred_score < 50 else (1 if pred_score < 70 else 0)
                confidence = 80.0
        else:
            pred_score = round(min(100.0, (prev_score * 0.6) + (attendance * 0.3) + (study_hours * 1.5)), 1)
            risk_code = 2 if pred_score < 50 else (1 if pred_score < 70 else 0)
            confidence = 80.0

        risk_map = {0: "Low", 1: "Medium", 2: "High"}
        grade_map = {0: "Needs Improvement", 1: "Average / Good", 2: "Excellent"}
        grade_label = "A/Excellent" if pred_score >= 80 else ("B/Good" if pred_score >= 60 else "C/Needs Improvement")

        rec_map = {
            "High": "High academic risk flagged. Schedule remedial tutoring in core subjects and monitor daily study hours.",
            "Medium": "Maintain consistent study schedule with focused attention on challenging assignments.",
            "Low": "Progress on track. Advanced learning track recommended with leadership/mentorship opportunities."
        }
        risk_str = risk_map.get(risk_code, "Medium")

        return {
            "predicted_score": pred_score,
            "predicted_grade": grade_label,
            "risk_level": risk_str,
            "confidence": confidence,
            "recommendation": rec_map.get(risk_str, "")
        }

    # =========================================================================
    # 2. HEALTH RISK PREDICTION & MONITORING
    # =========================================================================
    def predict_health_for_child(self, child_id):
        from .models import Child, Health

        child = Child.objects.filter(pk=child_id).first()
        if not child:
            return {"status": "error", "message": f"Child with ID {child_id} not found."}

        health_qs = Health.objects.filter(child=child).order_by('-checkup_date')
        if not health_qs.exists():
            return {
                "status": "insufficient_data",
                "child_id": child.child_id,
                "child_name": child.full_name,
                "message": "No recorded health checkup data available.",
                "health_status": "Insufficient Data",
                "risk_level": "Insufficient Data",
                "recommendation": "Schedule routine medical examination to establish baseline pediatric parameters."
            }

        latest = health_qs.first()
        h_m = float(latest.height_cm) / 100.0 if latest.height_cm else 1.2
        w_kg = float(latest.weight_kg) if latest.weight_kg else 25.0
        bmi = round(w_kg / (h_m * h_m), 1) if h_m > 0 else 18.0

        # Months since checkup
        gap_months = 1.0
        if latest.checkup_date:
            days = (date.today() - latest.checkup_date).days
            gap_months = max(0.1, round(days / 30.0, 1))

        # Check health notes for sick reports
        sick_days = 0
        for h in health_qs[:3]:
            notes = (h.notes or '').lower()
            if any(term in notes for term in ['fever', 'cold', 'infection', 'anaemia', 'sick', 'treatment']):
                sick_days += 2

        # Pediatric BMI assessment
        if bmi < 14.5:
            status_label = "Underweight / Nutritional Follow-up"
            risk_level = "Medium"
        elif bmi > 25.0:
            status_label = "Overweight / Dietary Review"
            risk_level = "Medium"
        elif latest.status in ['Critical', 'Under Treatment']:
            status_label = latest.status
            risk_level = "High"
        else:
            status_label = "Normal"
            risk_level = "Low"

        # Model inference if available
        confidence = 88.0
        if self.health_svm:
            try:
                feat = np.array([[bmi, 1.0, gap_months, sick_days]])
                code = int(self.health_svm.predict(feat)[0])
                probs = self.health_svm.predict_proba(feat)[0]
                confidence = round(float(np.max(probs)) * 100, 1)
                risk_map = {0: "Low", 1: "Medium", 2: "High"}
                risk_level = risk_map.get(code, risk_level)
            except Exception:
                pass

        if risk_level == "High":
            rec = "Health risk indicator elevated. Pediatric follow-up and dietary plan review recommended."
        elif risk_level == "Medium":
            rec = "Nutritional monitoring and scheduled checkup within 30 days advised."
        else:
            rec = "Regular health monitoring. Maintain balanced diet, hydration, and outdoor physical activities."

        return {
            "status": "success",
            "child_id": child.child_id,
            "child_name": child.full_name,
            "bmi": bmi,
            "height_cm": float(latest.height_cm),
            "weight_kg": float(latest.weight_kg),
            "vaccination_status": latest.vaccination_status or "Up to Date",
            "health_status": status_label,
            "risk_level": risk_level,
            "confidence": confidence,
            "recommendation": rec,
            "disclaimer": "This indicator is generated by automated health risk models for monitoring purposes and does not constitute a medical diagnosis."
        }

    def predict_health(self, bmi, sick_days):
        gap_months = 2.0
        risk_level = "Low"
        confidence = 85.0

        if self.health_svm:
            try:
                feat = np.array([[bmi, 1.0, gap_months, sick_days]])
                code = int(self.health_svm.predict(feat)[0])
                probs = self.health_svm.predict_proba(feat)[0]
                confidence = round(float(np.max(probs)) * 100, 1)
                risk_map = {0: "Low", 1: "Medium", 2: "High"}
                risk_level = risk_map.get(code, "Low")
            except Exception:
                if bmi < 15.0 or sick_days >= 6:
                    risk_level = "High"
                elif bmi < 17.0 or sick_days >= 3:
                    risk_level = "Medium"
        else:
            if bmi < 15.0 or sick_days >= 6:
                risk_level = "High"
            elif bmi < 17.0 or sick_days >= 3:
                risk_level = "Medium"

        rec_map = {
            "Low": "Regular health monitoring. Maintain active routine and balanced nutrition.",
            "Medium": "Nutritional monitoring and scheduled follow-up advised.",
            "High": "Pediatric consultation recommended to assess growth parameters."
        }

        return {
            "health_status": "Normal" if risk_level == "Low" else "Under Observation",
            "risk_level": risk_level,
            "confidence": confidence,
            "recommendation": rec_map.get(risk_level, "Regular health monitoring"),
            "disclaimer": "Risk indicators are automated screening tools, not clinical diagnoses."
        }

    # =========================================================================
    # 3. BEHAVIOUR & DEVELOPMENT MONITORING
    # =========================================================================
    def predict_behavior_for_child(self, child_id):
        from .models import Child, Behaviour

        child = Child.objects.filter(pk=child_id).first()
        if not child:
            return {"status": "error", "message": f"Child with ID {child_id} not found."}

        behav_qs = Behaviour.objects.filter(child=child).order_by('-observation_date')
        if not behav_qs.exists():
            return {
                "status": "insufficient_data",
                "child_id": child.child_id,
                "child_name": child.full_name,
                "message": "No recorded caregiver behaviour observations available.",
                "behaviour_trend": "Insufficient Data",
                "development_status": "Insufficient Data",
                "recommendation": "Caregiver behavioral and social engagement observation required."
            }

        recent = list(behav_qs[:5])
        total_incidents = sum(b.incident_count for b in recent)
        avg_interaction = float(np.mean([float(b.interaction_score) for b in recent]))
        
        # Trend
        if len(recent) >= 2:
            first_inter = float(recent[0].interaction_score)
            older_inter = float(recent[-1].interaction_score)
            trend_str = "Improving" if first_inter > older_inter + 0.5 else ("Needs Support" if first_inter < older_inter - 0.5 else "Stable")
        else:
            trend_str = "Stable"

        confidence = 86.0
        if self.behav_knn:
            try:
                feat = np.array([[total_incidents, avg_interaction, 7.5, len(recent)]])
                code = int(self.behav_knn.predict(feat)[0])
                probs = self.behav_knn.predict_proba(feat)[0]
                confidence = round(float(np.max(probs)) * 100, 1)
            except Exception:
                code = 1 if (total_incidents >= 2 or avg_interaction < 6.0) else 0
        else:
            code = 1 if (total_incidents >= 2 or avg_interaction < 6.0) else 0

        status_map = {
            0: "Age-Appropriate Emotional & Social Adjustment",
            1: "Moderate Social Adjustment / Guided Support",
            2: "Caregiver Attention & Counselor Mentorship Needed"
        }
        dev_status = status_map.get(code, "Age-Appropriate Emotional & Social Adjustment")

        if code == 2:
            rec = "Schedule one-on-one caregiver dialogue and channel energy into cooperative team activities."
        elif code == 1:
            rec = "Encourage expressive arts, club activities, and buddy-system peer interaction."
        else:
            rec = "Continue positive reinforcement and leadership roles in group activities."

        return {
            "status": "success",
            "child_id": child.child_id,
            "child_name": child.full_name,
            "behaviour_trend": trend_str,
            "development_status": dev_status,
            "average_interaction_score": round(avg_interaction, 1),
            "recent_incidents": total_incidents,
            "important_observations": recent[0].observations if recent else "Positive engagement.",
            "recommended_intervention": rec,
            "confidence": confidence,
            "note": "AI predictions represent observational guidance and should be interpreted by professional care staff."
        }

    def predict_behavior(self, incidents, interaction_score):
        confidence = 84.0
        if self.behav_knn:
            try:
                feat = np.array([[incidents, interaction_score, 7.0, 3]])
                code = int(self.behav_knn.predict(feat)[0])
                probs = self.behav_knn.predict_proba(feat)[0]
                confidence = round(float(np.max(probs)) * 100, 1)
            except Exception:
                code = 1 if (incidents >= 2 or interaction_score < 6.0) else 0
        else:
            code = 1 if (incidents >= 2 or interaction_score < 6.0) else 0

        status_map = {0: "Stable / Positive", 1: "Needs Caregiver Encouragement", 2: "Intervention Recommended"}
        rec_map = {
            0: "Child demonstrates healthy emotional balance and strong social engagement.",
            1: "Higher conflict incidents or lower interaction detected. Assign counselor mentorship.",
            2: "Caregiver intervention recommended with active social mentoring."
        }
        return {
            "behavior_status": status_map.get(code, "Stable / Positive"),
            "confidence": confidence,
            "recommendation": rec_map.get(code, rec_map[0])
        }

    # =========================================================================
    # 4. GROWTH FORECAST
    # =========================================================================
    def predict_growth(self, age, height, weight):
        h_inc = round(3.2 if age <= 12 else 2.1, 1)
        w_inc = round(1.8 if age <= 12 else 2.5, 1)
        predicted_height = round(height + h_inc, 1)
        predicted_weight = round(weight + w_inc, 1)

        bmi = weight / ((height / 100.0) ** 2) if height > 0 else 18.0
        is_normal = 14.5 <= bmi <= 24.5

        return {
            "growth_forecast": "Normal Growth Trajectory" if is_normal else "Consult Nutritionist",
            "predicted_height": predicted_height,
            "predicted_weight": predicted_weight,
            "confidence": 89.5,
            "recommendation": "Growth curve on track. Maintain protein-rich meals and daily outdoor play." if is_normal else "Nutritional enrichment recommended to match standard age percentiles."
        }

    # =========================================================================
    # 5. PERSONALIZED LEARNING RECOMMENDATIONS
    # =========================================================================
    def generate_learning_recommendations(self, child_id):
        from .models import Child, Education, Attendance

        child = Child.objects.filter(pk=child_id).first()
        if not child:
            return {"status": "error", "message": "Child not found."}

        edu_qs = Education.objects.filter(child=child).order_by('-exam_date')
        att_qs = Attendance.objects.filter(child=child)

        if not edu_qs.exists():
            return {
                "child_id": child.child_id,
                "child_name": child.full_name,
                "has_data": False,
                "message": "Insufficient academic records to generate personalized recommendations.",
                "recommendations": []
            }

        # Subject-wise marks aggregation
        subj_map = {}
        for e in edu_qs:
            if e.subject not in subj_map:
                subj_map[e.subject] = {
                    "marks": [],
                    "remarks": e.remarks or ""
                }
            if e.marks is not None:
                subj_map[e.subject]["marks"].append(float(e.marks))

        # Attendance calculation
        total_att = att_qs.count()
        att_rate = round((att_qs.filter(attendance_status='Present').count() / total_att * 100), 1) if total_att > 0 else None

        recommendations = []

        # Curated actionable advice pool
        subject_advice = {
            "mathematics": [
                "Practice basic algebra and arithmetic for 30 minutes daily",
                "Complete additional geometry exercises with step-by-step solutions",
                "Teacher review once per week for doubt clarification"
            ],
            "science": [
                "Review visual concept diagrams and scientific formulas daily",
                "Conduct interactive lab or practical kit demonstrations",
                "Peer-study group sessions twice weekly"
            ],
            "english": [
                "Encourage 20 minutes of daily storybook reading aloud",
                "Practice vocabulary building and sentence construction exercises",
                "Weekly essay writing with teacher feedback"
            ],
            "social": [
                "Use timeline charts and map-pointing exercises for historical concepts",
                "Summarize textbook chapters into bullet-point notes",
                "Interactive quiz sessions on weekends"
            ],
            "general": [
                "Structured 45-minute evening study block in quiet study hall",
                "Weekly progress check-in with assigned academic mentor"
            ]
        }

        for subj, data in subj_map.items():
            if not data["marks"]:
                continue
            avg_m = np.mean(data["marks"])
            s_clean = subj.strip().lower()
            pool_key = "general"
            for k in subject_advice:
                if k in s_clean:
                    pool_key = k
                    break

            advice_items = list(subject_advice[pool_key])
            if avg_m < 60:
                status_label = "Needs Improvement"
                priority = "High"
            elif avg_m < 75:
                status_label = "Satisfactory / Moderate"
                priority = "Medium"
                advice_items = [advice_items[0], "Participate in science & math clubs for advanced challenges"]
            else:
                status_label = "Strong Performance"
                priority = "Low"
                advice_items = ["Maintain current momentum and consider mentoring junior students"]

            recommendations.append({
                "subject": subj,
                "current_average": round(avg_m, 1),
                "status": status_label,
                "priority": priority,
                "actionable_steps": advice_items,
                "teacher_remarks": data["remarks"]
            })

        # Attendance intervention
        if att_rate is not None and att_rate < 75.0:
            recommendations.append({
                "subject": "Attendance & Regularity",
                "current_average": att_rate,
                "status": "Attendance Warning",
                "priority": "High",
                "actionable_steps": [
                    f"Current attendance is {att_rate}% (below 75% threshold)",
                    "Conduct caregiver follow-up on reasons for absenteeism",
                    "Ensure child attends all morning study periods"
                ],
                "teacher_remarks": "Low attendance is impacting academic continuity."
            })

        return {
            "child_id": child.child_id,
            "child_name": child.full_name,
            "has_data": True,
            "overall_attendance": att_rate,
            "total_subjects_evaluated": len(recommendations),
            "recommendations": recommendations
        }

    # =========================================================================
    # 6. OVERALL CHILD DEVELOPMENT SCORE
    # =========================================================================
    def calculate_child_development_score(self, child_id):
        from .models import Child, Education, Health, Attendance, Behaviour, Achievement

        child = Child.objects.filter(pk=child_id).first()
        if not child:
            return {"status": "error", "message": "Child not found."}

        # 1. Academic Development (25%)
        edu_qs = Education.objects.filter(child=child)
        if edu_qs.exists():
            marks = [float(e.marks) for e in edu_qs if e.marks is not None]
            if marks:
                acad_score = round(float(np.mean(marks)), 1)
                acad_status = "Good" if acad_score >= 75 else ("Average" if acad_score >= 55 else "Needs Support")
            else:
                acad_score, acad_status = None, "Insufficient data"
        else:
            acad_score, acad_status = None, "Insufficient data"

        # 2. Health Status (25%)
        health_qs = Health.objects.filter(child=child).order_by('-checkup_date')
        if health_qs.exists():
            latest = health_qs.first()
            h_m = float(latest.height_cm) / 100.0 if latest.height_cm else 1.2
            w_kg = float(latest.weight_kg) if latest.weight_kg else 25.0
            bmi = round(w_kg / (h_m * h_m), 1) if h_m > 0 else 18.0

            if 16.0 <= bmi <= 23.5 and latest.status == 'Healthy':
                health_score = 92.0
                health_status = "Normal - Healthy"
            elif 14.5 <= bmi <= 25.0:
                health_score = 75.0
                health_status = "Moderate / Stable"
            else:
                health_score = 55.0
                health_status = "Underweight / Clinical Follow-up"
        else:
            health_score, health_status = None, "Insufficient data"

        # 3. Attendance (20%)
        att_qs = Attendance.objects.filter(child=child)
        total_att = att_qs.count()
        if total_att >= 3:
            pres = att_qs.filter(attendance_status='Present').count()
            att_score = round((pres / total_att) * 100.0, 1)
            att_status = "Excellent" if att_score >= 85 else ("Satisfactory" if att_score >= 70 else "Low Attendance")
        else:
            att_score, att_status = None, "Insufficient data"

        # 4. Behaviour & Social (20%)
        behav_qs = Behaviour.objects.filter(child=child)
        if behav_qs.exists():
            scores = [float(b.interaction_score) for b in behav_qs if b.interaction_score is not None]
            incidents = sum(b.incident_count for b in behav_qs)
            raw_b = (np.mean(scores) * 10.0) - (incidents * 5.0) if scores else 75.0
            behav_score = round(min(100.0, max(20.0, raw_b)), 1)
            behav_status = "Positive / Socially Active" if behav_score >= 75 else ("Stable" if behav_score >= 60 else "Attention Required")
        else:
            behav_score, behav_status = None, "Insufficient data"

        # 5. Achievements & Extracurricular (10%)
        ach_count = Achievement.objects.filter(child=child).count()
        ach_score = min(100.0, 50.0 + (ach_count * 15.0))
        ach_status = f"{ach_count} Recorded Achievement(s)"

        # Composite Score Calculation (only using dimensions with valid data)
        weights = []
        scores = []
        if acad_score is not None:
            weights.append(0.25); scores.append(acad_score)
        if health_score is not None:
            weights.append(0.25); scores.append(health_score)
        if att_score is not None:
            weights.append(0.20); scores.append(att_score)
        if behav_score is not None:
            weights.append(0.20); scores.append(behav_score)
        if ach_score is not None and ach_count > 0:
            weights.append(0.10); scores.append(ach_score)

        if len(scores) >= 2:
            norm_weights = np.array(weights) / sum(weights)
            overall_score = round(float(np.dot(scores, norm_weights)), 1)
            overall_status = "Optimal Growth & Development" if overall_score >= 80 else ("On Track" if overall_score >= 65 else "Needs Multidisciplinary Support")
        else:
            overall_score = None
            overall_status = "Insufficient data"

        return {
            "child_id": child.child_id,
            "child_name": child.full_name,
            "dimensions": {
                "academic": {
                    "score": acad_score,
                    "status": acad_status,
                    "label": "Academic Development"
                },
                "health": {
                    "score": health_score,
                    "status": health_status,
                    "label": "Health Status"
                },
                "attendance": {
                    "score": att_score,
                    "status": att_status,
                    "label": "Attendance"
                },
                "behaviour": {
                    "score": behav_score,
                    "status": behav_status,
                    "label": "Behaviour & Social"
                },
                "achievements": {
                    "score": ach_score if ach_count > 0 else None,
                    "status": ach_status,
                    "label": "Achievements"
                }
            },
            "overall_score": overall_score,
            "overall_status": overall_status
        }

# Global singleton
ml_engine = MLEngine()
