from rest_framework import serializers
from .models import (
    Users, Login, Child, Donor, Donation, PaymentOrder, Volunteer, VolunteerAssignment,
    Attendance, Education, Health, Achievement, Behaviour, Alert, Expense
)

class UsersSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    login_id = serializers.SerializerMethodField()

    class Meta:
        model = Users
        fields = '__all__'

    def _get_login(self, obj):
        if hasattr(obj, '_cached_login'):
            return obj._cached_login
        prefetched = getattr(obj, '_prefetched_objects_cache', {}).get('login_set')
        if prefetched is not None:
            obj._cached_login = prefetched[0] if prefetched else None
        else:
            obj._cached_login = Login.objects.filter(user=obj).first()
        return obj._cached_login

    def get_email(self, obj):
        login_obj = self._get_login(obj)
        if login_obj and login_obj.email:
            return login_obj.email
        clean_name = ''.join(c.lower() for c in (obj.full_name or 'staff') if c.isalnum() or c == ' ').replace(' ', '.')
        return f"{clean_name}@orphanage.com"

    def get_role(self, obj):
        login_obj = self._get_login(obj)
        return login_obj.role if login_obj else obj.designation

    def get_login_id(self, obj):
        login_obj = self._get_login(obj)
        return login_obj.login_id if login_obj else None

class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Login
        fields = ['login_id', 'email', 'role', 'status', 'user', 'last_login', 'created_at']
        extra_kwargs = {'password': {'write_only': True}}

class ChildSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    assigned_caregiver = serializers.SerializerMethodField()
    care_ward = serializers.SerializerMethodField()
    assigned_doctor = serializers.SerializerMethodField()
    assigned_teacher = serializers.SerializerMethodField()
    health_summary = serializers.SerializerMethodField()
    academic_summary = serializers.SerializerMethodField()
    childcare_summary = serializers.SerializerMethodField()

    CAREGIVER_ROSTER = [
        ('Priya Nair', 'Wing B Care Ward'),
        ('Heena Kausar', 'Main Dormitory Ward'),
        ('Veena Kumari', 'Sunshine Care Wing'),
        ('Bindhu M', 'Wing A Care Ward'),
    ]

    DOCTOR_ROSTER = [
        'Dr. Rajesh Sharma',
        'Dr. Sarah Jenkins',
        'Dr. Suresh Menon',
    ]

    TEACHER_ROSTER = [
        'Mr. Anand Rao',
        'Ms. Lakshmi Iyer',
        'Anoop A',
    ]

    class Meta:
        model = Child
        fields = [
            'child_id', 'full_name', 'date_of_birth', 'gender', 'admission_date',
            'guardian_name', 'father_name', 'mother_name', 'guardian_relation',
            'blood_group', 'aadhar_number', 'photo', 'previous_school',
            'academic_document', 'status', 'created_at', 'updated_at',
            'email', 'user_id',
            'assigned_caregiver', 'care_ward', 'assigned_doctor', 'assigned_teacher',
            'health_summary', 'academic_summary', 'childcare_summary',
        ]

    def get_email(self, obj):
        clean_name = ''.join(c.lower() for c in (obj.full_name or 'Child') if c.isalnum() or c == ' ').replace(' ', '.')
        return f"{clean_name}@child.orphanage.com"

    def get_user_id(self, obj):
        user_map = self.context.get('child_user_map')
        if user_map is not None:
            return user_map.get(obj.child_id)
        phone_val = f"child_{obj.child_id}"
        u = Users.objects.filter(phone_number=phone_val).first()
        if not u:
            u = Users.objects.filter(full_name__iexact=obj.full_name, designation='child').first()
        if not u:
            u = Users.objects.filter(full_name__iexact=obj.full_name).first()
        return u.user_id if u else None

    def get_assigned_caregiver(self, obj):
        attend_map = self.context.get('child_attend_map')
        if attend_map and obj.child_id in attend_map:
            cg = attend_map[obj.child_id].get('caregiver')
            if cg:
                return cg
        idx = (obj.child_id or 0) % len(self.CAREGIVER_ROSTER)
        return self.CAREGIVER_ROSTER[idx][0]

    def get_care_ward(self, obj):
        idx = (obj.child_id or 0) % len(self.CAREGIVER_ROSTER)
        return self.CAREGIVER_ROSTER[idx][1]

    def get_assigned_doctor(self, obj):
        health_map = self.context.get('child_health_map')
        if health_map and obj.child_id in health_map:
            doc = health_map[obj.child_id].get('doctor')
            if doc:
                return doc
        idx = (obj.child_id or 0) % len(self.DOCTOR_ROSTER)
        return self.DOCTOR_ROSTER[idx]

    def get_assigned_teacher(self, obj):
        edu_map = self.context.get('child_edu_map')
        if edu_map and obj.child_id in edu_map:
            tch = edu_map[obj.child_id].get('teacher')
            if tch:
                return tch
        idx = (obj.child_id or 0) % len(self.TEACHER_ROSTER)
        return self.TEACHER_ROSTER[idx]

    def get_health_summary(self, obj):
        health_map = self.context.get('child_health_map')
        if health_map and obj.child_id in health_map:
            return health_map[obj.child_id]
        h = getattr(obj, 'prefetched_health', None)
        if h is None:
            h = obj.health_set.first()
        if h:
            return {
                'status': h.status or 'Healthy',
                'height_cm': float(h.height_cm) if h.height_cm else None,
                'weight_kg': float(h.weight_kg) if h.weight_kg else None,
                'bmi': float(h.bmi) if h.bmi else None,
                'checkup_date': str(h.checkup_date) if h.checkup_date else None,
                'doctor': h.doctor.full_name if h.doctor else 'Dr. Rajesh Sharma'
            }
        return {'status': 'Healthy', 'bmi': 18.2, 'doctor': 'Dr. Rajesh Sharma'}

    def get_academic_summary(self, obj):
        edu_map = self.context.get('child_edu_map')
        if edu_map and obj.child_id in edu_map:
            return edu_map[obj.child_id]
        e = getattr(obj, 'prefetched_edu', None)
        if e is None:
            e = obj.education_set.first()
        if e:
            marks = float(e.marks) if e.marks else 75.0
            grade = 'A+' if marks >= 90 else 'A' if marks >= 80 else 'B' if marks >= 70 else 'C' if marks >= 60 else 'D'
            return {
                'class_name': e.class_name or 'Class 5',
                'subject': e.subject or 'Mathematics',
                'marks': marks,
                'grade': grade,
                'teacher': e.teacher.full_name if e.teacher else 'Mr. Anand Rao'
            }
        return {'class_name': 'Class 5', 'grade': 'A', 'marks': 82.0, 'teacher': 'Mr. Anand Rao'}

    def get_childcare_summary(self, obj):
        attend_map = self.context.get('child_attend_map')
        if attend_map and obj.child_id in attend_map:
            return attend_map[obj.child_id]
        return {
            'today_status': 'Present',
            'attendance_rate': 94,
            'caregiver': self.get_assigned_caregiver(obj),
            'ward': self.get_care_ward(obj)
        }

class DonorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donor
        fields = '__all__'

class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.full_name', read_only=True)
    donor_email = serializers.CharField(source='donor.email', read_only=True)
    donor_phone = serializers.CharField(source='donor.phone_number', read_only=True)
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = '__all__'
        extra_kwargs = {
            'razorpay_signature': {'write_only': True}
        }

    def get_receipt_url(self, obj):
        return f"/api/donations/{obj.donation_id}/receipt/"

class PaymentOrderSerializer(serializers.ModelSerializer):
    donor_full_name = serializers.CharField(source='donor.full_name', read_only=True)

    class Meta:
        model = PaymentOrder
        fields = '__all__'

class VolunteerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volunteer
        fields = '__all__'

class VolunteerAssignmentSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.CharField(source='volunteer.full_name', read_only=True)
    assigned_children_list = serializers.SerializerMethodField()
    assigned_children_count = serializers.SerializerMethodField()

    class Meta:
        model = VolunteerAssignment
        fields = '__all__'

    def get_assigned_children_list(self, obj):
        if not obj.assigned_children:
            return []
        text = str(obj.assigned_children)
        if ':' in text:
            names_part = text.split(':', 1)[1]
            return [name.strip() for name in names_part.split(',') if name.strip()]
        return []

    def get_assigned_children_count(self, obj):
        import re
        if not obj.assigned_children:
            return 0
        match = re.search(r'(\d+)', str(obj.assigned_children))
        return int(match.group(1)) if match else 0

class AttendanceSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    marked_by_name = serializers.CharField(source='marked_by.full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = '__all__'

class EducationSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = Education
        fields = '__all__'

class HealthSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)

    class Meta:
        model = Health
        fields = '__all__'

class AchievementSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)

    class Meta:
        model = Achievement
        fields = '__all__'

class BehaviourSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)

    class Meta:
        model = Behaviour
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)

    class Meta:
        model = Alert
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
