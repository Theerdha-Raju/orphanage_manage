import urllib.request
import json
import base64
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from .models import (
    Users, Login, Child, Donor, Donation, Volunteer, VolunteerAssignment,
    Attendance, Education, Health, Achievement, Behaviour, Alert, Expense
)
from .serializers import (
    UsersSerializer, LoginSerializer, ChildSerializer, DonorSerializer, 
    DonationSerializer, VolunteerSerializer, VolunteerAssignmentSerializer, 
    AttendanceSerializer, EducationSerializer, HealthSerializer, 
    AchievementSerializer, BehaviourSerializer, AlertSerializer, ExpenseSerializer
)
from .ml_engine import ml_engine

class UsersViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all()
    serializer_class = UsersSerializer

    def perform_update(self, serializer):
        user = serializer.save()
        data = self.request.data
        login_obj = Login.objects.filter(user=user).first()
        if login_obj:
            if 'email' in data and data['email']:
                login_obj.email = data['email'].strip().lower()
            if 'password' in data and data['password']:
                login_obj.password = data['password'].strip()
            if 'designation' in data and data['designation']:
                des = data['designation'].strip().lower()
                login_obj.role = 'staff' if des in ['caregiver', 'staff'] else des
            if 'status' in data and data['status']:
                login_obj.status = data['status']
            login_obj.save()

    def perform_destroy(self, instance):
        Login.objects.filter(user=instance).delete()
        instance.delete()

class LoginViewSet(viewsets.ModelViewSet):
    queryset = Login.objects.all()
    serializer_class = LoginSerializer

class ChildViewSet(viewsets.ModelViewSet):
    queryset = Child.objects.all().order_by('-child_id')
    serializer_class = ChildSerializer

    def get_queryset(self):
        qs = Child.objects.all().order_by('-child_id')
        cid = self.request.query_params.get('child') or self.request.query_params.get('child_id')
        if cid:
            qs = qs.filter(child_id=cid)
        uid = self.request.query_params.get('user_id')
        if uid:
            u = Users.objects.filter(user_id=uid).first()
            if u:
                if u.phone_number and str(u.phone_number).startswith('child_'):
                    try:
                        c_id = int(str(u.phone_number).replace('child_', ''))
                        return qs.filter(child_id=c_id)
                    except (ValueError, TypeError):
                        pass
                return qs.filter(full_name__iexact=u.full_name)
        return qs

    def perform_create(self, serializer):
        child = serializer.save()
        self.sync_login(child, self.request.data.get('password'))

    def perform_update(self, serializer):
        child = serializer.save()
        self.sync_login(child, self.request.data.get('password'))

    def sync_login(self, child, custom_password=None):
        clean_name = ''.join(c.lower() for c in (child.full_name or 'Child') if c.isalnum() or c == ' ').replace(' ', '.')
        c_email = f"{clean_name}@child.orphanage.com"
        
        phone_val = f"child_{child.child_id}"
        user = Users.objects.filter(phone_number=phone_val).first()
        if not user:
            user = Users.objects.create(
                full_name=child.full_name,
                phone_number=phone_val,
                gender=child.gender or 'Other',
                address='',
                designation='child',
                status=child.status or 'Active'
            )
        
        first = (child.full_name or 'Child').strip().split()[0]
        first = ''.join(c for c in first if c.isalpha()) or 'Child'
        pwd = custom_password or f"{first}@Child123"

        login_obj = Login.objects.filter(email__iexact=c_email).first()
        if login_obj:
            login_obj.role = 'child'
            if custom_password:
                login_obj.password = custom_password
            login_obj.user = user
            login_obj.save()
        else:
            Login.objects.create(
                email=c_email,
                password=pwd,
                role='child',
                status='Active',
                user=user
            )

class DonorViewSet(viewsets.ModelViewSet):
    queryset = Donor.objects.all().order_by('-donor_id')
    serializer_class = DonorSerializer

    def perform_create(self, serializer):
        donor = serializer.save()
        self.sync_login(donor, self.request.data.get('password'))

    def perform_update(self, serializer):
        donor = serializer.save()
        self.sync_login(donor, self.request.data.get('password'))

    def sync_login(self, donor, custom_password=None):
        if not donor.email:
            return
        
        user = Users.objects.filter(phone_number=donor.phone_number).first() if donor.phone_number else None
        if not user:
            user = Users.objects.filter(full_name=donor.full_name, designation='donor').first()
        if not user:
            phone_val = donor.phone_number or f"donor_{donor.donor_id}"
            user = Users.objects.create(
                full_name=donor.full_name,
                phone_number=phone_val,
                gender='Other',
                address=donor.address or '',
                designation='donor',
                status=donor.status or 'Active'
            )
        
        first = (donor.full_name or 'Donor').strip().split()[0]
        first = ''.join(c for c in first if c.isalpha()) or 'Donor'
        pwd = custom_password or f"{first}@Donor123"

        login_obj = Login.objects.filter(email__iexact=donor.email).first()
        if login_obj:
            login_obj.role = 'donor'
            if custom_password:
                login_obj.password = custom_password
            login_obj.user = user
            login_obj.save()
        else:
            Login.objects.create(
                email=donor.email,
                password=pwd,
                role='donor',
                status='Active',
                user=user
            )

class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer

class VolunteerViewSet(viewsets.ModelViewSet):
    queryset = Volunteer.objects.all().order_by('-volunteer_id')
    serializer_class = VolunteerSerializer

    def perform_create(self, serializer):
        vol = serializer.save()
        self.sync_login(vol, self.request.data.get('password'))

    def perform_update(self, serializer):
        vol = serializer.save()
        self.sync_login(vol, self.request.data.get('password'))

    def sync_login(self, vol, custom_password=None):
        v_email = vol.email
        if not v_email or 'example.com' in v_email:
            clean_name = ''.join(c.lower() for c in (vol.full_name or 'Vol') if c.isalnum() or c == ' ').replace(' ', '.')
            v_email = f"{clean_name}@volunteer.orphanage.com"
            vol.email = v_email
            vol.save()

        phone_val = vol.phone_number or f"vol_{vol.volunteer_id}"
        user = Users.objects.filter(phone_number=phone_val).first()
        if not user:
            user = Users.objects.create(
                full_name=vol.full_name,
                phone_number=phone_val,
                gender='Other',
                address='',
                designation='volunteer',
                status=vol.status or 'Active'
            )
        
        first = (vol.full_name or 'Volunteer').strip().split()[0]
        first = ''.join(c for c in first if c.isalpha()) or 'Volunteer'
        pwd = custom_password or f"{first}@Vol123"

        login_obj = Login.objects.filter(email__iexact=v_email).first()
        if login_obj:
            login_obj.role = 'volunteer'
            if custom_password:
                login_obj.password = custom_password
            login_obj.user = user
            login_obj.save()
        else:
            Login.objects.create(
                email=v_email,
                password=pwd,
                role='volunteer',
                status='Active',
                user=user
            )

class VolunteerAssignmentViewSet(viewsets.ModelViewSet):
    queryset = VolunteerAssignment.objects.all().order_by('-assignment_id')
    serializer_class = VolunteerAssignmentSerializer

# Dedicated Volunteer Module API Endpoints

def resolve_volunteer(request):
    """
    Intelligently resolve volunteer instance from volunteer_id, email (including aliases), or user_id.
    """
    vol_id = request.query_params.get('volunteer_id') or (request.data.get('volunteer_id') if hasattr(request, 'data') else None)
    email = request.query_params.get('email') or (request.data.get('email') if hasattr(request, 'data') else None)
    user_id = request.query_params.get('user_id') or (request.data.get('user_id') if hasattr(request, 'data') else None)

    if vol_id:
        v = Volunteer.objects.filter(pk=vol_id).first()
        if v:
            return v

    if email:
        email = email.strip()
        # 1. Direct email match
        v = Volunteer.objects.filter(email__iexact=email).first()
        if v:
            return v

        # 2. Check Login table -> linked User -> Volunteer
        l = Login.objects.filter(email__iexact=email).first()
        if l and l.user:
            v = Volunteer.objects.filter(full_name__iexact=l.user.full_name).first()
            if v:
                return v

        # 3. Check Users table by email or phone
        u = Users.objects.filter(email__iexact=email).first() or Users.objects.filter(phone_number__iexact=email).first()
        if u:
            v = Volunteer.objects.filter(full_name__iexact=u.full_name).first()
            if v:
                return v

        # 4. Check name prefix in email (e.g. rahul.singh@... -> Rahul Singh)
        prefix = email.split('@')[0].replace('.', ' ').strip()
        v = Volunteer.objects.filter(full_name__iexact=prefix).first() or Volunteer.objects.filter(full_name__icontains=prefix).first()
        if v:
            return v

    if user_id:
        u = Users.objects.filter(user_id=user_id).first()
        if u:
            v = Volunteer.objects.filter(full_name__iexact=u.full_name).first()
            if v:
                return v

    return None


@api_view(['GET', 'PUT', 'PATCH'])
def volunteer_profile_api(request):
    """
    GET: Retrieve logged-in volunteer profile
    PUT/PATCH: Update logged-in volunteer profile
    """
    vol = resolve_volunteer(request)
    if not vol:
        # Fallback to first active volunteer
        vol = Volunteer.objects.filter(status='Active').first() or Volunteer.objects.first()

    if not vol:
        return Response({'error': 'Volunteer profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = VolunteerSerializer(vol)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        data = request.data
        if 'full_name' in data and data['full_name'].strip():
            vol.full_name = data['full_name'].strip()
        if 'phone_number' in data:
            vol.phone_number = data['phone_number'].strip() or None
        if 'email' in data and data['email'].strip():
            vol.email = data['email'].strip()
        if 'address' in data:
            vol.address = data['address']
        if 'skills' in data:
            vol.skills = data['skills']
        if 'areas_of_interest' in data:
            vol.areas_of_interest = data['areas_of_interest']
        if 'availability' in data:
            vol.availability = data['availability']
        if 'status' in data:
            vol.status = data['status']
        vol.save()

        # Sync Users table if exists
        usr = Users.objects.filter(phone_number=vol.phone_number).first() or Users.objects.filter(full_name=vol.full_name).first()
        if usr:
            usr.full_name = vol.full_name
            if vol.phone_number: usr.phone_number = vol.phone_number
            if vol.address: usr.address = vol.address
            usr.save()

        serializer = VolunteerSerializer(vol)
        return Response({'message': 'Profile updated successfully.', 'data': serializer.data})


@api_view(['GET'])
def volunteer_activities_api(request):
    """
    GET: Retrieve assigned activities for logged-in volunteer with search and filter options
    """
    vol = resolve_volunteer(request)

    if vol:
        activities = VolunteerAssignment.objects.filter(volunteer=vol)
    elif request.query_params.get('email') or request.query_params.get('volunteer_id') or request.query_params.get('user_id'):
        # Specific volunteer requested but none matched
        activities = VolunteerAssignment.objects.none()
    else:
        # General view without volunteer filter (e.g. admin/general activities directory)
        activities = VolunteerAssignment.objects.all()

    # Search filter
    search = request.query_params.get('search')
    if search:
        activities = activities.filter(
            models.Q(event_name__icontains=search) |
            models.Q(description__icontains=search) |
            models.Q(location__icontains=search) |
            models.Q(activity_type__icontains=search) |
            models.Q(assigned_children__icontains=search)
        )

    # Status filter
    status_filter = request.query_params.get('status')
    if status_filter and status_filter != 'All':
        activities = activities.filter(status=status_filter)

    # Activity Type filter
    type_filter = request.query_params.get('activity_type')
    if type_filter and type_filter != 'All':
        activities = activities.filter(activity_type__iexact=type_filter)

    # Date filter
    date_filter = request.query_params.get('date')
    if date_filter:
        activities = activities.filter(
            models.Q(scheduled_date=date_filter) |
            models.Q(assigned_date=date_filter) |
            models.Q(due_date=date_filter)
        )

    activities = activities.order_by('-scheduled_date', '-assigned_date')
    serializer = VolunteerAssignmentSerializer(activities, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def volunteer_activity_detail_api(request, activity_id):
    """
    GET: Get detailed activity information
    """
    activity = VolunteerAssignment.objects.filter(pk=activity_id).first()
    if not activity:
        return Response({'error': 'Activity not found.'}, status=status.HTTP_404_NOT_FOUND)
    serializer = VolunteerAssignmentSerializer(activity)
    return Response(serializer.data)

@api_view(['PATCH', 'PUT'])
def volunteer_activity_status_api(request, activity_id):
    """
    PATCH/PUT: Update status of an assigned activity (Pending -> In Progress -> Completed)
    Accepts: status, remarks, feedback, completion_date
    """
    from datetime import date
    activity = VolunteerAssignment.objects.filter(pk=activity_id).first()
    if not activity:
        return Response({'error': 'Activity not found.'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if not new_status:
        return Response({'error': 'Status field is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if new_status not in ['Pending', 'In Progress', 'Completed']:
        return Response({'error': 'Invalid status. Must be Pending, In Progress, or Completed.'}, status=status.HTTP_400_BAD_REQUEST)

    activity.status = new_status

    if 'remarks' in request.data:
        activity.remarks = request.data['remarks']
    if 'feedback' in request.data:
        activity.feedback = request.data['feedback']
        if not activity.remarks:
            activity.remarks = request.data['feedback']

    if new_status == 'Completed':
        comp_date = request.data.get('completion_date')
        if comp_date:
            activity.completion_date = comp_date
        elif not activity.completion_date:
            activity.completion_date = date.today().isoformat()
    elif new_status == 'In Progress':
        # Clear completion date if reopened
        activity.completion_date = None

    activity.save()

    serializer = VolunteerAssignmentSerializer(activity)
    return Response({
        'message': 'Activity status updated successfully.',
        'assignment_id': activity.assignment_id,
        'status': activity.status,
        'data': serializer.data
    })

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        qs = Attendance.objects.all().order_by('-attendance_date')
        cid = self.request.query_params.get('child') or self.request.query_params.get('child_id')
        if cid:
            qs = qs.filter(child_id=cid)
        date = self.request.query_params.get('date') or self.request.query_params.get('attendance_date')
        if date:
            qs = qs.filter(attendance_date=date)
        return qs

    def create(self, request, *args, **kwargs):
        # Gracefully handle upsert if record for (child, attendance_date) already exists
        child_id = request.data.get('child')
        att_date = request.data.get('attendance_date')
        att_status = request.data.get('attendance_status', 'Present')
        marked_by_id = request.data.get('marked_by')
        
        if child_id and att_date:
            att_obj, created = Attendance.objects.update_or_create(
                child_id=child_id,
                attendance_date=att_date,
                defaults={
                    'attendance_status': att_status,
                    'marked_by_id': marked_by_id if marked_by_id else None
                }
            )
            serializer = self.get_serializer(att_obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def mark(self, request):
        """
        Bulk mark or update attendance for multiple children.
        Body: {
            date: "YYYY-MM-DD",
            marked_by: user_id (optional),
            records: [
                { child_id: 1, status: "Present" },
                ...
            ]
        }
        """
        data = request.data
        att_date = data.get('date') or timezone.now().strftime('%Y-%m-%d')
        marked_by_id = data.get('marked_by')
        records = data.get('records', [])
        
        results = []
        for r in records:
            c_id = r.get('child_id') or r.get('child')
            st = r.get('status') or r.get('attendance_status', 'Present')
            if not c_id:
                continue
            obj, created = Attendance.objects.update_or_create(
                child_id=c_id,
                attendance_date=att_date,
                defaults={
                    'attendance_status': st,
                    'marked_by_id': marked_by_id if marked_by_id else None
                }
            )
            results.append({
                'child_id': c_id,
                'status': st,
                'created': created
            })
        
        return Response({
            'success': True,
            'date': att_date,
            'updated_count': len(results),
            'records': results
        }, status=status.HTTP_200_OK)

class EducationViewSet(viewsets.ModelViewSet):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer

    def get_queryset(self):
        qs = Education.objects.all().order_by('-exam_date')
        cid = self.request.query_params.get('child') or self.request.query_params.get('child_id')
        if cid:
            qs = qs.filter(child_id=cid)
        cname = self.request.query_params.get('child_name')
        if cname:
            qs = qs.filter(child__full_name__icontains=cname)
        return qs

class HealthViewSet(viewsets.ModelViewSet):
    queryset = Health.objects.all()
    serializer_class = HealthSerializer

    def get_queryset(self):
        qs = Health.objects.all().order_by('-checkup_date')
        cid = self.request.query_params.get('child') or self.request.query_params.get('child_id')
        if cid:
            qs = qs.filter(child_id=cid)
        return qs

class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer

    def get_queryset(self):
        qs = Achievement.objects.all().order_by('-achievement_date')
        cid = self.request.query_params.get('child') or self.request.query_params.get('child_id')
        if cid:
            qs = qs.filter(child_id=cid)
        return qs

class BehaviourViewSet(viewsets.ModelViewSet):
    queryset = Behaviour.objects.all().order_by('-observation_date', '-behaviour_id')
    serializer_class = BehaviourSerializer

    def get_queryset(self):
        qs = Behaviour.objects.all().order_by('-observation_date', '-behaviour_id')
        cid = self.request.query_params.get('child') or self.request.query_params.get('child_id')
        if cid:
            qs = qs.filter(child_id=cid)
        return qs

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-created_date')
    serializer_class = AlertSerializer

    def get_queryset(self):
        qs = Alert.objects.all().order_by('-created_date')
        cid = self.request.query_params.get('child') or self.request.query_params.get('child_id')
        status_param = self.request.query_params.get('status')
        if cid:
            qs = qs.filter(child_id=cid)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert_obj = self.get_object()
        notes = request.data.get('resolution_notes', 'Resolved by authorized staff.')
        alert_obj.status = 'Resolved'
        alert_obj.resolution_notes = notes
        alert_obj.resolved_at = timezone.now()
        alert_obj.save()
        return Response(AlertSerializer(alert_obj).data)

@api_view(['POST'])
def resolve_alert_api(request, alert_id):
    alert_obj = Alert.objects.filter(pk=alert_id).first()
    if not alert_obj:
        return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)
    notes = request.data.get('resolution_notes', 'Resolved by staff member.')
    alert_obj.status = 'Resolved'
    alert_obj.resolution_notes = notes
    alert_obj.resolved_at = timezone.now()
    alert_obj.save()
    return Response(AlertSerializer(alert_obj).data)

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-expense_date')
    serializer_class = ExpenseSerializer


# AI / ML Intelligence Endpoints

@api_view(['GET'])
def child_development_score_api(request, child_id):
    """Computes 5-dimension child development score from actual database records."""
    try:
        score_data = ml_engine.calculate_child_development_score(child_id)
        return Response(score_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def learning_recommendations_api(request, child_id):
    """Generates personalized, actionable learning recommendations based on subject marks & attendance."""
    try:
        rec_data = ml_engine.generate_learning_recommendations(child_id)
        return Response(rec_data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def predict_academic(request):
    """
    AI Academic Performance, Risk Level & Trend Prediction.
    Supports either real database data by child_id or custom simulation parameters.
    """
    data = request.data
    try:
        child_id = data.get('child_id')
        use_child_data = data.get('use_child_data', False) or ('attendance' not in data and 'prev_score' not in data and child_id)

        if use_child_data and child_id:
            result = ml_engine.predict_academic_for_child(child_id)
        else:
            att = float(data.get('attendance', 85))
            prev = float(data.get('prev_score', data.get('past_score', 75)))
            hours = float(data.get('study_hours', 3))
            result = ml_engine.predict_academic(att, prev, hours)

        # Log alert for high or medium academic risk
        if child_id and result.get('status') != 'insufficient_data':
            risk = result.get('risk_level', 'Low')
            if risk in ['High', 'Medium']:
                c_obj = Child.objects.filter(pk=child_id).first()
                if c_obj:
                    priority_val = 'High' if risk == 'High' else 'Medium'
                    Alert.objects.create(
                        child=c_obj,
                        alert_type="Academic Risk",
                        priority=priority_val,
                        message=f"[Academic AI] {c_obj.full_name}: Risk Level {risk}, Trend: {result.get('performance_trend', 'Stable')}. {result.get('recommendation', '')}"
                    )
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def predict_health(request):
    """
    Pediatric Health Risk Screening.
    Outputs risk level and monitoring advice (labeled as risk indicators, not diagnoses).
    """
    data = request.data
    try:
        child_id = data.get('child_id')
        use_child_data = data.get('use_child_data', False) or ('bmi' not in data and child_id)

        if use_child_data and child_id:
            result = ml_engine.predict_health_for_child(child_id)
        else:
            bmi = float(data.get('bmi', 18.5))
            sick_days = float(data.get('sick_days', 1))
            result = ml_engine.predict_health(bmi, sick_days)

        if child_id and result.get('status') != 'insufficient_data':
            risk = result.get('risk_level', 'Low')
            if risk in ['High', 'Medium']:
                c_obj = Child.objects.filter(pk=child_id).first()
                if c_obj:
                    priority_val = 'High' if risk == 'High' else 'Medium'
                    Alert.objects.create(
                        child=c_obj,
                        alert_type="Health Follow-up",
                        priority=priority_val,
                        message=f"[Health Risk Indicator] {c_obj.full_name}: Risk Level {risk}. {result.get('recommendation', '')}"
                    )
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def predict_behavior(request):
    """
    Behaviour & Social Adjustment Pattern Detection.
    """
    data = request.data
    try:
        child_id = data.get('child_id')
        use_child_data = data.get('use_child_data', False) or ('incidents' not in data and child_id)

        if use_child_data and child_id:
            result = ml_engine.predict_behavior_for_child(child_id)
        else:
            incidents = float(data.get('incidents', 0))
            interaction = float(data.get('interaction_score', 8))
            result = ml_engine.predict_behavior(incidents, interaction)

        if child_id and result.get('status') != 'insufficient_data':
            trend = result.get('behaviour_trend', '')
            if 'Needs' in trend or 'Intervention' in result.get('development_status', ''):
                c_obj = Child.objects.filter(pk=child_id).first()
                if c_obj:
                    Alert.objects.create(
                        child=c_obj,
                        alert_type="Behaviour Concern",
                        priority="Medium",
                        message=f"[Behaviour Observation] {c_obj.full_name}: {result.get('development_status', '')}. {result.get('recommended_intervention', '')}"
                    )
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def predict_growth(request):
    data = request.data
    try:
        age = float(data.get('age', 10))
        height = float(data.get('height', 135))
        weight = float(data.get('weight', 30))
        child_id = data.get('child_id')
        
        result = ml_engine.predict_growth(age, height, weight)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def dashboard_stats_api(request):
    """Comprehensive real-time dashboard statistics for admin panel."""
    from django.db.models import Sum, Count, Avg
    from datetime import date, timedelta
    try:
        now = date.today()
        month_start = now.replace(day=1)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)

        # Children stats
        total_children = Child.objects.count()
        active_children = Child.objects.filter(status='Active').count()
        new_this_month = Child.objects.filter(admission_date__gte=month_start).count()

        # Staff stats
        staff_list = Users.objects.filter(
            designation__in=['Caregiver', 'Teacher', 'Doctor', 'Administrator', 'staff']
        )
        total_staff = staff_list.count()

        # Volunteer stats
        total_volunteers = Volunteer.objects.count()
        active_volunteers = Volunteer.objects.filter(status='Active').count()

        # Donation stats
        donations = Donation.objects.all()
        total_donations = donations.filter(donation_type='Money').aggregate(total=Sum('amount'))['total'] or 0
        this_month_donations = donations.filter(
            donation_type='Money', donation_date__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        last_month_donations = donations.filter(
            donation_type='Money',
            donation_date__gte=last_month_start,
            donation_date__lt=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Expense stats
        total_expenses = Expense.objects.filter(status='Paid').aggregate(total=Sum('amount'))['total'] or 0
        this_month_expenses = Expense.objects.filter(
            status='Paid', expense_date__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Health stats
        health_records = Health.objects.values('child').distinct()
        healthy_count = Health.objects.filter(status='Healthy').values('child').distinct().count()
        at_risk_count = Health.objects.filter(status__in=['Mild Risk', 'Under Treatment', 'Critical']).values('child').distinct().count()

        # Attendance stats (last 30 days)
        recent_att = Attendance.objects.filter(attendance_date__gte=now - timedelta(days=30))
        total_att = recent_att.count()
        present_att = recent_att.filter(attendance_status='Present').count()
        avg_attendance_pct = round((present_att / total_att * 100), 1) if total_att > 0 else 0

        # Academic stats
        edu_records = Education.objects.all()
        academic_avg = edu_records.aggregate(avg=Avg('marks'))['avg']
        academic_avg = round(float(academic_avg), 1) if academic_avg else 0

        # Alert stats
        open_alerts = Alert.objects.filter(status='Open').count()
        high_priority_alerts = Alert.objects.filter(status='Open', priority='High').count()

        # Monthly donation trend (last 6 months)
        donation_trend = []
        for i in range(5, -1, -1):
            d = now - timedelta(days=30 * i)
            m_start = d.replace(day=1)
            if i > 0:
                next_d = now - timedelta(days=30 * (i - 1))
                m_end = next_d.replace(day=1)
            else:
                m_end = now + timedelta(days=1)
            total = donations.filter(
                donation_type='Money',
                donation_date__gte=m_start,
                donation_date__lt=m_end
            ).aggregate(total=Sum('amount'))['total'] or 0
            donation_trend.append({
                'month': m_start.strftime('%b %Y'),
                'amount': float(total)
            })

        # Subject-wise academic averages
        subject_avgs = {}
        for rec in edu_records:
            s = rec.subject
            if s not in subject_avgs:
                subject_avgs[s] = []
            if rec.marks is not None:
                subject_avgs[s].append(float(rec.marks))
        subject_chart = [
            {'subject': s, 'avg': round(sum(v) / len(v), 1)}
            for s, v in subject_avgs.items() if v
        ]

        # Expense by category
        expense_by_cat = {}
        for exp in Expense.objects.filter(status='Paid'):
            expense_by_cat[exp.category] = expense_by_cat.get(exp.category, 0) + float(exp.amount)
        expense_chart = [{'category': k, 'amount': round(v, 2)} for k, v in expense_by_cat.items()]

        return Response({
            'children': {
                'total': total_children,
                'active': active_children,
                'new_this_month': new_this_month,
            },
            'staff': {'total': total_staff},
            'volunteers': {'total': total_volunteers, 'active': active_volunteers},
            'donations': {
                'total': float(total_donations),
                'this_month': float(this_month_donations),
                'last_month': float(last_month_donations),
                'trend': donation_trend,
            },
            'expenses': {
                'total': float(total_expenses),
                'this_month': float(this_month_expenses),
                'by_category': expense_chart,
            },
            'health': {
                'healthy': healthy_count,
                'at_risk': at_risk_count,
            },
            'attendance': {
                'avg_percentage': avg_attendance_pct,
                'period': 'Last 30 days',
            },
            'academic': {
                'overall_average': academic_avg,
                'subject_averages': subject_chart,
            },
            'alerts': {
                'open': open_alerts,
                'high_priority': high_priority_alerts,
            }
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def bulk_ai_scan_api(request):
    """Run AI predictions for all children and return aggregated risk summary."""
    try:
        children = Child.objects.filter(status='Active')
        results = []
        high_risk_count = 0
        medium_risk_count = 0

        for child in children:
            acad = ml_engine.predict_academic_for_child(child.child_id)
            health = ml_engine.predict_health_for_child(child.child_id)
            behav = ml_engine.predict_behavior_for_child(child.child_id)
            dev = ml_engine.calculate_child_development_score(child.child_id)

            # Determine overall risk level
            risk_flags = []
            if acad.get('risk_level') == 'High':
                risk_flags.append('Academic')
                high_risk_count += 1
            elif acad.get('risk_level') == 'Medium':
                risk_flags.append('Academic')
                medium_risk_count += 1
            if health.get('risk_level') == 'High':
                risk_flags.append('Health')
                high_risk_count += 1
            elif health.get('risk_level') == 'Medium':
                risk_flags.append('Health')
                medium_risk_count += 1

            overall_risk = 'Low'
            if any(r in risk_flags for r in ['Academic', 'Health']) and acad.get('risk_level') == 'High':
                overall_risk = 'High'
            elif risk_flags:
                overall_risk = 'Medium'

            results.append({
                'child_id': child.child_id,
                'child_name': child.full_name,
                'academic_risk': acad.get('risk_level', 'N/A'),
                'health_risk': health.get('risk_level', 'N/A'),
                'behaviour_trend': behav.get('behaviour_trend', 'N/A'),
                'development_score': dev.get('overall_score'),
                'overall_risk': overall_risk,
                'risk_flags': risk_flags,
            })

        # Sort by risk (High first)
        risk_order = {'High': 0, 'Medium': 1, 'Low': 2}
        results.sort(key=lambda x: risk_order.get(x['overall_risk'], 3))

        return Response({
            'total_scanned': len(results),
            'high_risk': high_risk_count,
            'medium_risk': medium_risk_count,
            'results': results
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Authentication Endpoints
@api_view(['POST'])
def register_view(request):
    import uuid
    import re
    data = request.data
    try:
        name = (data.get('name') or data.get('full_name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        raw_des = (data.get('designation') or data.get('role') or 'Caregiver').strip()
        phone = (data.get('phone') or data.get('phone_number') or '').strip()
        gender = (data.get('gender') or 'Other').strip().capitalize()
        address = (data.get('address') or data.get('ward') or data.get('location') or '').strip()
        user_status = (data.get('status') or 'Active').strip()
        salary_raw = data.get('salary')
        try:
            salary = float(salary_raw) if salary_raw is not None and salary_raw != '' else None
        except (ValueError, TypeError):
            salary = None

        if gender not in ['Male', 'Female', 'Other']:
            gender = 'Other'

        if not name or len(name) < 2:
            return Response({'error': 'Full Name is required and must be at least 2 characters.'}, status=status.HTTP_400_BAD_REQUEST)

        if not email or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
            return Response({'error': 'A valid email address is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not password or len(password) < 6:
            return Response({'error': 'Password must be at least 6 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        # Phone validation if provided
        if phone:
            clean_phone = re.sub(r'[\s\-]', '', phone)
            if not re.match(r'^\+?\d{10,15}$', clean_phone):
                return Response({'error': 'Phone number must be between 10 and 15 digits.'}, status=status.HTTP_400_BAD_REQUEST)
            if Users.objects.filter(phone_number=phone).exists():
                return Response({'error': 'Phone number is already registered.'}, status=status.HTTP_400_BAD_REQUEST)
            db_phone = phone[:15]
        else:
            db_phone = f"N/A-{uuid.uuid4().hex[:8]}"

        # Designation and login role normalization
        des_lower = raw_des.lower()
        if des_lower in ['caregiver', 'staff']:
            normalized_designation = 'Caregiver'
            login_role = 'staff'
        elif des_lower == 'teacher':
            normalized_designation = 'Teacher'
            login_role = 'teacher'
        elif des_lower == 'doctor':
            normalized_designation = 'Doctor'
            login_role = 'doctor'
        elif des_lower == 'admin':
            normalized_designation = 'Administrator'
            login_role = 'admin'
        elif des_lower == 'donor':
            normalized_designation = 'Donor'
            login_role = 'donor'
        elif des_lower == 'volunteer':
            normalized_designation = 'Volunteer'
            login_role = 'volunteer'
        elif des_lower in ['child', 'student']:
            normalized_designation = 'Student'
            login_role = 'child'
        else:
            normalized_designation = raw_des.capitalize()
            login_role = 'staff'

        # Check if email exists
        if Login.objects.filter(email__iexact=email).exists():
            return Response({'error': 'Email is already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        user = Users.objects.create(
            full_name=name,
            phone_number=db_phone,
            gender=gender,
            address=address,
            designation=normalized_designation,
            salary=salary,
            status=user_status
        )
        
        # Create login with securely hashed password
        Login.objects.create(
            email=email,
            password=make_password(password),
            role=login_role,
            status=user_status,
            user=user
        )

        # If role is donor, create Donor record if not exists
        if login_role == 'donor':
            from .models import Donor
            if not Donor.objects.filter(email=email).exists():
                Donor.objects.create(
                    full_name=name,
                    email=email,
                    phone_number=phone if phone else None,
                    address=address
                )

        # If role is volunteer, create Volunteer record if not exists
        if login_role == 'volunteer':
            from .models import Volunteer
            if not Volunteer.objects.filter(email=email).exists():
                Volunteer.objects.create(
                    full_name=name,
                    email=email,
                    phone_number=phone if phone else None,
                    address=address,
                    availability='Flexible'
                )
        
        return Response({
            'success': True,
            'message': 'Registration successful',
            'user_id': user.user_id,
            'role': login_role,
            'designation': normalized_designation,
            'email': email,
            'name': name
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



def resolve_child_for_login(login_obj):
    """
    Intelligently resolve Child instance from login_obj or linked user.
    """
    if not login_obj:
        return None
    user = login_obj.user

    # 1. Match by phone_number on user (phone_number='child_<child_id>')
    if user and user.phone_number and str(user.phone_number).startswith('child_'):
        try:
            cid = int(str(user.phone_number).replace('child_', ''))
            ch = Child.objects.filter(child_id=cid).first()
            if ch:
                return ch
        except (ValueError, TypeError):
            pass

    # 2. Match by exact full_name
    if user and user.full_name:
        ch = Child.objects.filter(full_name__iexact=user.full_name.strip()).first()
        if ch:
            return ch

    # 3. Match by email username exact / parts (e.g. rohan.kumar@child.orphanage.com -> Rohan Kumar)
    if login_obj.email:
        prefix = login_obj.email.split('@')[0].replace('.', ' ').strip()
        ch = Child.objects.filter(full_name__iexact=prefix).first()
        if ch:
            return ch
        if '.' in login_obj.email.split('@')[0]:
            parts = [p for p in login_obj.email.split('@')[0].split('.') if p]
            qs = Child.objects.all()
            for p in parts:
                qs = qs.filter(full_name__icontains=p)
            ch = qs.first()
            if ch:
                return ch

    # 4. Match by first name
    if user and user.full_name:
        first = user.full_name.strip().split()[0]
        if len(first) > 2:
            ch = Child.objects.filter(full_name__istartswith=first).first()
            if ch:
                return ch

    # 5. Fallback to first Child
    return Child.objects.first()


@api_view(['POST'])
def login_view(request):
    data = request.data
    try:
        raw_email = (data.get('email') or '').strip()
        email = raw_email.lower()
        password = (data.get('password') or '').strip()
        requested_role = (data.get('role') or '').strip().lower()
        
        # 1. Direct email match (case-insensitive)
        login_obj = None
        if email:
            login_obj = Login.objects.filter(email__iexact=email).first()
            
        # 2. Try match by username or handle prefix (e.g. "admin" -> "admin@orphanage.com")
        if not login_obj and email:
            login_obj = (
                Login.objects.filter(email__iexact=f"{email}@orphanage.com").first() or
                Login.objects.filter(email__istartswith=f"{email}@").first()
            )
            
        # 3. Try match by full name of user
        if not login_obj and raw_email:
            user_by_name = Users.objects.filter(full_name__iexact=raw_email).first()
            if user_by_name:
                login_obj = Login.objects.filter(user=user_by_name).first()

        # 4. Fallback to role matching if standard email alias or role name typed
        if not login_obj:
            role_map = {
                'admin': 'admin',
                'administrator': 'admin',
                'admin@orphanage.com': 'admin',
                'staff': 'staff',
                'caregiver': 'staff',
                'staff@orphanage.com': 'staff',
                'caregiver@orphanage.com': 'staff',
                'donor': 'donor',
                'donor@orphanage.com': 'donor',
                'volunteer': 'volunteer',
                'volunteer@orphanage.com': 'volunteer',
                'child': 'child',
                'student': 'child',
                'child@orphanage.com': 'child',
                'student@orphanage.com': 'child',
                'doctor': 'doctor',
                'doctor@orphanage.com': 'doctor',
                'teacher': 'teacher',
                'teacher@orphanage.com': 'teacher',
            }
            target_role = role_map.get(email) or (requested_role if requested_role in ['admin', 'staff', 'donor', 'volunteer', 'child', 'doctor', 'teacher'] else None)
            if target_role:
                login_obj = (
                    Login.objects.filter(email__iexact=f"{target_role}@orphanage.com").first() or
                    Login.objects.filter(role=target_role).first()
                )

        # 5. If still not found and requested_role provided:
        if not login_obj and requested_role:
            login_obj = Login.objects.filter(role=requested_role).first()

        # 6. Fallback if empty or not found:
        if not login_obj:
            if requested_role == 'admin' or 'admin' in email:
                login_obj = Login.objects.filter(role='admin').first()
            elif requested_role == 'staff' or 'staff' in email or 'caregiver' in email:
                login_obj = Login.objects.filter(role='staff').first()
            elif requested_role == 'donor' or 'donor' in email:
                login_obj = Login.objects.filter(role='donor').first()
            elif requested_role == 'volunteer' or 'vol' in email:
                login_obj = Login.objects.filter(role='volunteer').first()
            elif requested_role == 'child' or 'student' in email or 'child' in email:
                login_obj = Login.objects.filter(role='child').first()
            else:
                login_obj = Login.objects.filter(role='admin').first() or Login.objects.first()

        if not login_obj:
            return Response({'error': 'User account not found.'}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Secure Password Check
        input_clean = password.strip()
        stored_pwd = login_obj.password or ''
        is_valid = False

        if stored_pwd.startswith(('pbkdf2_', 'bcrypt$', 'argon2')):
            is_valid = check_password(input_clean, stored_pwd)
        else:
            if stored_pwd == input_clean:
                is_valid = True
                # Transparently upgrade legacy plain text password to secure hash
                login_obj.password = make_password(input_clean)
                login_obj.save(update_fields=['password'])

        if not is_valid:
            return Response({'error': 'Invalid credentials. Please verify your email and password.'}, status=status.HTTP_401_UNAUTHORIZED)
            
        user_id = login_obj.user.user_id if login_obj.user else login_obj.login_id
        user_name = (
            login_obj.user.full_name
            if (login_obj.user and login_obj.user.full_name)
            else login_obj.email.split('@')[0].capitalize()
        )

        user_designation = 'Caregiver'
        if login_obj.user and login_obj.user.designation:
            raw_des = login_obj.user.designation.strip().lower()
            if raw_des in ['caregiver', 'staff']:
                user_designation = 'Caregiver'
            elif raw_des == 'teacher':
                user_designation = 'Teacher'
            elif raw_des == 'doctor':
                user_designation = 'Doctor'
            elif raw_des == 'admin':
                user_designation = 'Administrator'
            else:
                user_designation = login_obj.user.designation.capitalize()
        elif login_obj.role in ['teacher', 'doctor']:
            user_designation = login_obj.role.capitalize()
        elif login_obj.role == 'staff':
            user_designation = 'Caregiver'
        elif login_obj.role == 'admin':
            user_designation = 'Administrator'
        else:
            user_designation = login_obj.role.capitalize()

        child_id = None
        if login_obj.role == 'child':
            matched_child = resolve_child_for_login(login_obj)
            if matched_child:
                child_id = matched_child.child_id
                if not (login_obj.user and login_obj.user.full_name) or login_obj.user.full_name in ['User', 'Child', 'Student']:
                    user_name = matched_child.full_name

        return Response({
            'success': True,
            'role': login_obj.role,
            'designation': user_designation,
            'user_id': user_id,
            'child_id': child_id,
            'email': login_obj.email,
            'name': user_name
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def google_login_view(request):
    data = request.data
    try:
        credential = data.get('credential') or data.get('id_token')
        role = data.get('role', 'volunteer')
        email = data.get('email')
        name = data.get('name')

        if credential:
            try:
                url = f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=5) as response:
                    info = json.loads(response.read().decode('utf-8'))
                    email = info.get('email') or email
                    name = info.get('name') or info.get('given_name') or name
            except Exception:
                try:
                    parts = credential.split('.')
                    if len(parts) == 3:
                        padded = parts[1] + '=' * (-len(parts[1]) % 4)
                        payload = json.loads(base64.b64decode(padded).decode('utf-8'))
                        email = email or payload.get('email')
                        name = name or payload.get('name') or payload.get('given_name')
                except Exception:
                    pass

        if not email:
            return Response({'error': 'Email could not be verified from Google account.'}, status=status.HTTP_400_BAD_REQUEST)

        name = name or email.split('@')[0].capitalize()

        login_obj = Login.objects.filter(email=email).first()

        if not login_obj:
            user = Users.objects.create(
                full_name=name,
                phone_number='',
                gender='Other',
                address='',
                designation=role
            )
            login_obj = Login.objects.create(
                email=email,
                password='[GOOGLE_OAUTH]',
                role=role,
                user=user
            )

        child_id = None
        if login_obj.role == 'child':
            matched_child = resolve_child_for_login(login_obj)
            if matched_child:
                child_id = matched_child.child_id

        return Response({
            'success': True,
            'role': login_obj.role,
            'user_id': login_obj.user.user_id,
            'child_id': child_id,
            'email': login_obj.email,
            'name': login_obj.user.full_name
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

