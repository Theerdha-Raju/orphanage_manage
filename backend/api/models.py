from django.db import models
from django.utils.translation import gettext_lazy as _

class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    phone_number = models.CharField(unique=True, max_length=15)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')])
    address = models.CharField(max_length=255)
    designation = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
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
    GUARDIAN_RELATION_CHOICES = [
        ('Father', 'Father'),
        ('Mother', 'Mother'),
        ('Uncle', 'Uncle'),
        ('Aunt', 'Aunt'),
        ('Grandparent', 'Grandparent'),
        ('Sibling', 'Sibling'),
        ('Government', 'Government'),
        ('None', 'None'),
    ]

    child_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')])
    admission_date = models.DateField()
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    father_name = models.CharField(max_length=100, blank=True, null=True)
    mother_name = models.CharField(max_length=100, blank=True, null=True)
    guardian_relation = models.CharField(max_length=50, choices=GUARDIAN_RELATION_CHOICES, blank=True, null=True)
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
    purpose = models.CharField(max_length=100, default='General Welfare', blank=True)
    receipt_number = models.CharField(max_length=50, blank=True, null=True)
    payment_method = models.CharField(max_length=50, default='Online Transfer', blank=True)
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
    areas_of_interest = models.TextField(blank=True, null=True)
    availability = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'volunteer'

    def __str__(self):
        return self.full_name

class VolunteerAssignment(models.Model):
    PRIORITY_CHOICES = [
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ]

    assignment_id = models.AutoField(primary_key=True)
    volunteer = models.ForeignKey(Volunteer, models.CASCADE)
    event_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    activity_type = models.CharField(max_length=100, default='Education', blank=True, null=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    assigned_date = models.DateField()
    scheduled_date = models.DateField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    assigned_children = models.CharField(max_length=200, blank=True, null=True, default='5 Children')
    location = models.CharField(max_length=255, blank=True, null=True)
    assigned_by = models.CharField(max_length=100, blank=True, null=True, default='Admin')
    instructions = models.TextField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    completion_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'volunteer_assignment'

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Leave', 'Leave'),
    ]

    attendance_id = models.AutoField(primary_key=True)
    child = models.ForeignKey(Child, models.CASCADE)
    attendance_date = models.DateField()
    attendance_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Present')
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
    assignment_marks = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    internal_marks = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    exam_marks = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    term = models.CharField(max_length=50, default='Annual Exam', blank=True)
    teacher = models.ForeignKey(Users, models.SET_NULL, blank=True, null=True, related_name='recorded_educations')
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
    bmi = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)
    checkup_date = models.DateField()
    medical_history = models.TextField(blank=True, null=True)
    vaccination_status = models.CharField(max_length=100, default='Up to Date', blank=True)
    allergies = models.CharField(max_length=200, blank=True, null=True)
    medications = models.TextField(blank=True, null=True)
    doctor_remarks = models.TextField(blank=True, null=True)
    doctor = models.ForeignKey(Users, models.SET_NULL, blank=True, null=True, related_name='recorded_health_records')
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

class Behaviour(models.Model):
    CATEGORY_CHOICES = [
        ('Social', 'Social Interaction'),
        ('Emotional', 'Emotional Wellbeing'),
        ('Discipline', 'Discipline & Conduct'),
        ('Extracurricular', 'Extracurricular & Sports'),
        ('Academic', 'Academic Engagement'),
    ]
    PARTICIPATION_CHOICES = [
        ('High', 'High / Active Participation'),
        ('Medium', 'Moderate Participation'),
        ('Low', 'Needs Encouragement / Low'),
    ]

    behaviour_id = models.AutoField(primary_key=True)
    child = models.ForeignKey(Child, models.CASCADE, related_name='behaviour_records')
    recorded_by = models.ForeignKey(Users, models.SET_NULL, blank=True, null=True, related_name='recorded_behaviours')
    observation_date = models.DateField()
    behaviour_category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Social')
    incident_count = models.IntegerField(default=0)
    interaction_score = models.DecimalField(max_digits=3, decimal_places=1, default=8.0) # 1.0 to 10.0
    participation_level = models.CharField(max_length=50, choices=PARTICIPATION_CHOICES, default='High')
    social_activities = models.TextField(blank=True, null=True)
    extracurricular_activities = models.TextField(blank=True, null=True)
    observations = models.TextField(blank=True, null=True)
    caregiver_remarks = models.TextField(blank=True, null=True)
    recommended_intervention = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'behaviour'

    def __str__(self):
        return f"{self.child.full_name} - {self.behaviour_category} ({self.observation_date})"

class Alert(models.Model):
    PRIORITY_CHOICES = [
        ('High', 'High'),
        ('Medium', 'Medium'),
        ('Low', 'Low'),
    ]
    STATUS_CHOICES = [
        ('Open', 'Open'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved'),
    ]

    alert_id = models.AutoField(primary_key=True)
    child = models.ForeignKey(Child, models.CASCADE)
    alert_type = models.CharField(max_length=50) # e.g. Low Attendance, Academic Risk, Health Follow-up, Behaviour Concern
    message = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    created_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Open')
    assigned_to = models.ForeignKey(Users, models.SET_NULL, blank=True, null=True, related_name='assigned_alerts')
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolution_notes = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'alert'

    def __str__(self):
        return f"[{self.priority}] {self.alert_type} - {self.child.full_name}"

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
