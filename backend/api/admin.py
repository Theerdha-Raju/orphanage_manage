from django.contrib import admin
from .models import Users, Login, Child, Donor, Donation, Volunteer, VolunteerAssignment, Attendance, Education, Health, Achievement, Alert, Expense

@admin.register(Users)
class UsersAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'full_name', 'phone_number', 'designation', 'status')
    search_fields = ('full_name', 'phone_number')
    list_filter = ('status', 'designation')

@admin.register(Login)
class LoginAdmin(admin.ModelAdmin):
    list_display = ('login_id', 'user', 'email', 'role', 'last_login')
    search_fields = ('email', 'user__full_name')
    list_filter = ('role',)

@admin.register(Child)
class ChildAdmin(admin.ModelAdmin):
    list_display = ('child_id', 'full_name', 'date_of_birth', 'gender', 'blood_group', 'status')
    search_fields = ('full_name', 'guardian_name')
    list_filter = ('gender', 'status', 'blood_group')

@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    list_display = ('donor_id', 'full_name', 'email', 'phone_number', 'status')
    search_fields = ('full_name', 'email', 'phone_number')
    list_filter = ('status',)

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('donation_id', 'donor', 'donation_type', 'amount', 'donation_date', 'status')
    search_fields = ('donor__full_name', 'item_description')
    list_filter = ('donation_type', 'status', 'donation_date')

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('expense_id', 'title', 'category', 'amount', 'expense_date', 'paid_by', 'status')
    search_fields = ('title', 'paid_by', 'description')
    list_filter = ('category', 'status', 'expense_date')

@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ('volunteer_id', 'full_name', 'email', 'phone_number', 'availability', 'status')
    search_fields = ('full_name', 'email', 'skills')
    list_filter = ('status', 'availability')

@admin.register(VolunteerAssignment)
class VolunteerAssignmentAdmin(admin.ModelAdmin):
    list_display = ('assignment_id', 'volunteer', 'event_name', 'assigned_date', 'status')
    search_fields = ('volunteer__full_name', 'event_name')
    list_filter = ('status', 'assigned_date')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('attendance_id', 'child', 'attendance_date', 'attendance_status')
    search_fields = ('child__full_name',)
    list_filter = ('attendance_status', 'attendance_date')

@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ('education_id', 'child', 'class_name', 'subject', 'marks', 'exam_date')
    search_fields = ('child__full_name', 'subject', 'class_name')
    list_filter = ('class_name', 'subject')

@admin.register(Health)
class HealthAdmin(admin.ModelAdmin):
    list_display = ('health_id', 'child', 'height_cm', 'weight_kg', 'checkup_date', 'status')
    search_fields = ('child__full_name', 'notes')
    list_filter = ('status', 'checkup_date')

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('achievement_id', 'child', 'title', 'category', 'achievement_date')
    search_fields = ('child__full_name', 'title')
    list_filter = ('category',)

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('alert_id', 'child', 'alert_type', 'status', 'created_date')
    search_fields = ('child__full_name', 'message')
    list_filter = ('alert_type', 'status')

