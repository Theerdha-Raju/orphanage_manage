from rest_framework import serializers
from .models import Users, Login, Child, Donor, Donation, Volunteer, VolunteerAssignment, Attendance, Education, Health, Achievement, Alert, Expense

class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = '__all__'

class LoginSerializer(serializers.ModelSerializer):
    class Meta:
        model = Login
        fields = '__all__'

class ChildSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    password = serializers.SerializerMethodField()

    class Meta:
        model = Child
        fields = '__all__'

    def get_email(self, obj):
        clean_name = ''.join(c.lower() for c in (obj.full_name or 'Child') if c.isalnum() or c == ' ').replace(' ', '.')
        return f"{clean_name}@child.orphanage.com"

    def get_password(self, obj):
        email = self.get_email(obj)
        login_obj = Login.objects.filter(email__iexact=email).first()
        if login_obj:
            return login_obj.password
        first = (obj.full_name or 'Child').strip().split()[0]
        first = ''.join(c for c in first if c.isalpha()) or 'Child'
        return f"{first}@Child123"

class DonorSerializer(serializers.ModelSerializer):
    password = serializers.SerializerMethodField()

    class Meta:
        model = Donor
        fields = '__all__'

    def get_password(self, obj):
        if obj.email:
            login_obj = Login.objects.filter(email__iexact=obj.email).first()
            if login_obj:
                return login_obj.password
        first = (obj.full_name or 'Donor').strip().split()[0]
        first = ''.join(c for c in first if c.isalpha()) or 'Donor'
        return f"{first}@Donor123"

class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.full_name', read_only=True)
    class Meta:
        model = Donation
        fields = '__all__'

class VolunteerSerializer(serializers.ModelSerializer):
    password = serializers.SerializerMethodField()

    class Meta:
        model = Volunteer
        fields = '__all__'

    def get_password(self, obj):
        if obj.email:
            login_obj = Login.objects.filter(email__iexact=obj.email).first()
            if login_obj:
                return login_obj.password
        first = (obj.full_name or 'Volunteer').strip().split()[0]
        first = ''.join(c for c in first if c.isalpha()) or 'Volunteer'
        return f"{first}@Vol123"

class VolunteerAssignmentSerializer(serializers.ModelSerializer):
    volunteer_name = serializers.CharField(source='volunteer.full_name', read_only=True)
    class Meta:
        model = VolunteerAssignment
        fields = '__all__'

class AttendanceSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    class Meta:
        model = Attendance
        fields = '__all__'

class EducationSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    class Meta:
        model = Education
        fields = '__all__'

class HealthSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    class Meta:
        model = Health
        fields = '__all__'

class AchievementSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    class Meta:
        model = Achievement
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.full_name', read_only=True)
    class Meta:
        model = Alert
        fields = '__all__'

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

