from django.db import models
from django.utils.translation import gettext_lazy as _

class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(unique=True, max_length=15)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')])
    address = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.full_name

class Login(models.Model):
    login_id = models.AutoField(primary_key=True)
    email = models.CharField(unique=True, max_length=150)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=[('admin', 'admin'), ('staff', 'staff'), ('doctor', 'doctor'), ('teacher', 'teacher'), ('volunteer', 'volunteer'), ('donor', 'donor')])
    status = models.CharField(max_length=20, default='Active')
    user = models.ForeignKey(Users, models.CASCADE)
    last_login = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'login'

    def __str__(self):
        return self.email

class Child(models.Model):
    child_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')])
    admission_date = models.DateField()
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    blood_group = models.CharField(max_length=5, blank=True, null=True)
    aadhar_number = models.CharField(max_length=20, blank=True, null=True)
    photo = models.FileField(upload_to='child_photos/', blank=True, null=True)
    previous_school = models.CharField(max_length=255, blank=True, null=True)
    academic_document = models.FileField(upload_to='academic_docs/', blank=True, null=True)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'child'

    def __str__(self):
        return self.full_name

class Donor(models.Model):
    donor_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(unique=True, max_length=15, blank=True, null=True)
    email = models.CharField(unique=True, max_length=150, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'donor'

    def __str__(self):
        return self.full_name

class Donation(models.Model):
    donation_id = models.AutoField(primary_key=True)
    donor = models.ForeignKey(Donor, models.CASCADE)
    donation_type = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    item_description = models.CharField(max_length=500, blank=True, null=True)
    donation_date = models.DateField()
    status = models.CharField(max_length=20, default='Received')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'donation'

    def __str__(self):
        return f"{self.donation_type} - {self.donor.full_name}"

class Volunteer(models.Model):
    volunteer_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(unique=True, max_length=15, blank=True, null=True)
    email = models.CharField(unique=True, max_length=150, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    skills = models.TextField(blank=True, null=True)
    availability = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'volunteer'

    def __str__(self):
        return self.full_name

class VolunteerAssignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    volunteer = models.ForeignKey(Volunteer, models.CASCADE)
    event_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    assigned_date = models.DateField()
    due_date = models.DateField(blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    assigned_by = models.CharField(max_length=100, blank=True, null=True, default='Admin')
    instructions = models.TextField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'volunteer_assignment'

class Attendance(models.Model):
    attendance_id = models.AutoField(primary_key=True)
    child = models.ForeignKey(Child, models.CASCADE)
    attendance_date = models.DateField()
    attendance_status = models.CharField(max_length=20)
    marked_by = models.ForeignKey(Users, models.SET_NULL, db_column='marked_by', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'attendance'
        unique_together = (('child', 'attendance_date'),)

class Education(models.Model):
    education_id = models.AutoField(primary_key=True)
    child = models.ForeignKey(Child, models.CASCADE)
    class_name = models.CharField(max_length=50)
    subject = models.CharField(max_length=100)
    marks = models.DecimalField(max_digits=5, decimal_places=2)
    exam_date = models.DateField()
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'education'

class Health(models.Model):
    health_id = models.AutoField(primary_key=True)
    child = models.ForeignKey(Child, models.CASCADE)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2)
    checkup_date = models.DateField()
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Healthy')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'health'

class Achievement(models.Model):
    achievement_id = models.AutoField(primary_key=True)
    child = models.ForeignKey(Child, models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    achievement_date = models.DateField()
    category = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'achievement'

class Alert(models.Model):
    alert_id = models.AutoField(primary_key=True)
    child = models.ForeignKey(Child, models.CASCADE)
    alert_type = models.CharField(max_length=20)
    message = models.TextField()
    created_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='Open')

    class Meta:
        db_table = 'alert'

class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('Food', 'Food'),
        ('Medical', 'Medical'),
        ('Education', 'Education'),
        ('Utilities', 'Utilities'),
        ('Maintenance', 'Maintenance'),
        ('Clothing', 'Clothing'),
        ('Transportation', 'Transportation'),
        ('Other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('Paid', 'Paid'),
        ('Pending', 'Pending'),
        ('Cancelled', 'Cancelled'),
    ]

    expense_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_date = models.DateField()
    paid_by = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Paid')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expense'

    def __str__(self):
        return f"{self.title} - ₹{self.amount}"
