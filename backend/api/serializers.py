from rest_framework import serializers
from .models import (
    Users, Login, Child, Donor, Donation, Volunteer, VolunteerAssignment,
    Attendance, Education, Health, Achievement, Behaviour, Alert, Expense
)

class UsersSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    login_id = serializers.SerializerMethodField()

    class Meta:
        model = Users
        fields = '__all__'

    def get_email(self, obj):
        login_obj = Login.objects.filter(user=obj).first()
        if login_obj and login_obj.email:
            return login_obj.email
        clean_name = ''.join(c.lower() for c in (obj.full_name or 'staff') if c.isalnum() or c == ' ').replace(' ', '.')
        return f"{clean_name}@orphanage.com"

    def get_role(self, obj):
        login_obj = Login.objects.filter(user=obj).first()
        return login_obj.role if login_obj else obj.designation

    def get_login_id(self, obj):
        login_obj = Login.objects.filter(user=obj).first()
        return login_obj.login_id if login_obj else None

class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Login
        fields = ['login_id', 'email', 'role', 'status', 'user', 'last_login', 'created_at']
        extra_kwargs = {'password': {'write_only': True}}

class ChildSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = Child
        fields = [
            'child_id', 'full_name', 'date_of_birth', 'gender', 'admission_date',
            'guardian_name', 'father_name', 'mother_name', 'guardian_relation',
            'blood_group', 'aadhar_number', 'photo', 'previous_school',
            'academic_document', 'status', 'created_at', 'updated_at',
            'email', 'user_id',
        ]

    def get_email(self, obj):
        clean_name = ''.join(c.lower() for c in (obj.full_name or 'Child') if c.isalnum() or c == ' ').replace(' ', '.')
        return f"{clean_name}@child.orphanage.com"

    def get_user_id(self, obj):
        phone_val = f"child_{obj.child_id}"
        u = Users.objects.filter(phone_number=phone_val).first()
        if not u:
            u = Users.objects.filter(full_name__iexact=obj.full_name, designation='child').first()
        if not u:
            u = Users.objects.filter(full_name__iexact=obj.full_name).first()
        return u.user_id if u else None

class DonorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Donor
        fields = '__all__'

class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.full_name', read_only=True)

    class Meta:
        model = Donation
        fields = '__all__'

class VolunteerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Volunteer
        fields = '__all__'

class VolunteerAssignmentSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.CharField(source='volunteer.full_name', read_only=True)

    class Meta:
        model = VolunteerAssignment
        fields = '__all__'

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
