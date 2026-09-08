import urllib.request
import json
import base64
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Users, Login, Child, Donor, Donation, Volunteer, VolunteerAssignment, Attendance, Education, Health, Achievement, Alert, Expense
from .serializers import (
    UsersSerializer, LoginSerializer, ChildSerializer, DonorSerializer, 
    DonationSerializer, VolunteerSerializer, VolunteerAssignmentSerializer, 
    AttendanceSerializer, EducationSerializer, HealthSerializer, 
    AchievementSerializer, AlertSerializer, ExpenseSerializer
)
from .ml_engine import ml_engine

class UsersViewSet(viewsets.ModelViewSet):
    queryset = Users.objects.all()
    serializer_class = UsersSerializer

class LoginViewSet(viewsets.ModelViewSet):
    queryset = Login.objects.all()
    serializer_class = LoginSerializer

class ChildViewSet(viewsets.ModelViewSet):
    queryset = Child.objects.all().order_by('-child_id')
    serializer_class = ChildSerializer

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

@api_view(['GET', 'PUT', 'PATCH'])
def volunteer_profile_api(request):
    """
    GET: Retrieve logged-in volunteer profile
    PUT/PATCH: Update logged-in volunteer profile
    """
    email = request.query_params.get('email') or request.data.get('email')
    vol_id = request.query_params.get('volunteer_id') or request.data.get('volunteer_id')
    user_id = request.query_params.get('user_id') or request.data.get('user_id')

    vol = None
    if vol_id:
        vol = Volunteer.objects.filter(pk=vol_id).first()
    if not vol and email:
        vol = Volunteer.objects.filter(email__iexact=email).first()
    if not vol and user_id:
        usr = Users.objects.filter(user_id=user_id).first()
        if usr:
            vol = Volunteer.objects.filter(full_name=usr.full_name).first() or Volunteer.objects.filter(phone_number=usr.phone_number).first()
    
    if not vol:
        # Fallback to first volunteer if dev testing
        vol = Volunteer.objects.first()

    if not vol:
        return Response({'error': 'Volunteer profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = VolunteerSerializer(vol)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        data = request.data
        if 'full_name' in data: vol.full_name = data['full_name']
        if 'phone_number' in data: vol.phone_number = data['phone_number']
        if 'email' in data: vol.email = data['email']
        if 'address' in data: vol.address = data['address']
        if 'skills' in data: vol.skills = data['skills']
        if 'availability' in data: vol.availability = data['availability']
        if 'status' in data: vol.status = data['status']
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
    GET: Retrieve assigned activities for logged-in volunteer
    """
    email = request.query_params.get('email')
    vol_id = request.query_params.get('volunteer_id')
    user_id = request.query_params.get('user_id')

    vol = None
    if vol_id:
        vol = Volunteer.objects.filter(pk=vol_id).first()
    if not vol and email:
        vol = Volunteer.objects.filter(email__iexact=email).first()
    if not vol and user_id:
        usr = Users.objects.filter(user_id=user_id).first()
        if usr:
            vol = Volunteer.objects.filter(full_name=usr.full_name).first()

    if vol:
        activities = VolunteerAssignment.objects.filter(volunteer=vol).order_by('-assigned_date')
    else:
        # If no filter passed or first run, return all assignments
        activities = VolunteerAssignment.objects.all().order_by('-assigned_date')

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
    """
    activity = VolunteerAssignment.objects.filter(pk=activity_id).first()
    if not activity:
        return Response({'error': 'Activity not found.'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if not new_status:
        return Response({'error': 'Status field is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if new_status not in ['Pending', 'In Progress', 'Completed']:
        return Response({'error': 'Invalid status. Must be Pending, In Progress, or Completed.'}, status=status.HTTP_400_BAD_REQUEST)

    activity.status = new_status
    if 'feedback' in request.data:
        activity.feedback = request.data['feedback']
    activity.save()

    return Response({
        'message': 'Activity status updated successfully.',
        'assignment_id': activity.assignment_id,
        'status': activity.status
    })

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

class EducationViewSet(viewsets.ModelViewSet):
    queryset = Education.objects.all()
    serializer_class = EducationSerializer

class HealthViewSet(viewsets.ModelViewSet):
    queryset = Health.objects.all()
    serializer_class = HealthSerializer

class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all().order_by('-created_date')
    serializer_class = AlertSerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-expense_date')
    serializer_class = ExpenseSerializer


# ML Prediction Endpoints

@api_view(['POST'])
def predict_academic(request):
    data = request.data
    try:
        att = float(data.get('attendance', 0))
        prev = float(data.get('prev_score', 0))
        hours = float(data.get('study_hours', 0))
        
        result = ml_engine.predict_academic(att, prev, hours)
        
        # Log prediction to Alert instead of AIPredictionLog
        Alert.objects.create(
            child_id=1, # Default to 1 if not provided, since child_id is required
            alert_type="Academic",
            message=f"[ML] Score: {result['predicted_score']}, Grade: {result['predicted_grade']} (Conf: {result['confidence']:.1f}%)"
        )
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def predict_health(request):
    data = request.data
    try:
        bmi = float(data.get('bmi', 0))
        sick_days = float(data.get('sick_days', 0))
        
        result = ml_engine.predict_health(bmi, sick_days)
        
        Alert.objects.create(
            child_id=1,
            alert_type="Health",
            message=f"[ML] Risk Level: {result['risk_level']} (Conf: {result['confidence']:.1f}%)"
        )
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def predict_behavior(request):
    data = request.data
    try:
        incidents = float(data.get('incidents', 0))
        interaction = float(data.get('interaction_score', 0))
        
        result = ml_engine.predict_behavior(incidents, interaction)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def predict_growth(request):
    data = request.data
    try:
        age = float(data.get('age', 0))
        height = float(data.get('height', 0))
        weight = float(data.get('weight', 0))
        
        result = ml_engine.predict_growth(age, height, weight)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Authentication Endpoints
@api_view(['POST'])
def register_view(request):
    data = request.data
    try:
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'volunteer') # Default to volunteer if not provided
        phone = data.get('phone', '')

        if not name or not email or not password:
            return Response({'error': 'Name, email, and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email exists
        if Login.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Create user
        user = Users.objects.create(
            full_name=name,
            phone_number=phone,
            gender='Other', # Defaulting for now
            address='',
            designation=role
        )
        
        # Create login
        Login.objects.create(
            email=email,
            password=password, # Saving in plain text as per legacy design
            role=role,
            user=user
        )
        
        return Response({'success': True, 'message': 'Registration successful'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login_view(request):
    data = request.data
    try:
        email = (data.get('email') or '').strip().lower()
        password = (data.get('password') or '').strip()
        
        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Try exact email match (case-insensitive)
        login_obj = Login.objects.filter(email__iexact=email).first()
        
        # If not found, try typo fallback (donar <-> donor)
        if not login_obj:
            alt_email = email.replace('donar', 'donor') if 'donar' in email else email.replace('donor', 'donar')
            login_obj = Login.objects.filter(email__iexact=alt_email).first()

        # Fallback to role matching if standard email typed
        if not login_obj:
            role_map = {
                'admin@orphanage.com': 'admin',
                'donor@orphanage.com': 'donor',
                'donar@orphanage.com': 'donor',
                'volunteer@orphanage.com': 'volunteer',
                'child@orphanage.com': 'child',
            }
            if email in role_map:
                login_obj = Login.objects.filter(role=role_map[email]).first()

        if not login_obj:
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
            
        # Strict password check — must match exactly
        valid_pwd = (login_obj.password == password)

        if not valid_pwd:
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)
            
        return Response({
            'success': True,
            'role': login_obj.role,
            'user_id': login_obj.user.user_id,
            'email': login_obj.email,
            'name': login_obj.user.full_name
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

        return Response({
            'success': True,
            'role': login_obj.role,
            'user_id': login_obj.user.user_id,
            'email': login_obj.email,
            'name': login_obj.user.full_name
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

