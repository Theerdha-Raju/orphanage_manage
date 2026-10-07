from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UsersViewSet)
router.register(r'logins', views.LoginViewSet)
router.register(r'children', views.ChildViewSet)
router.register(r'donors', views.DonorViewSet)
router.register(r'donations', views.DonationViewSet)
router.register(r'volunteers', views.VolunteerViewSet)
router.register(r'volunteer-assignments', views.VolunteerAssignmentViewSet)
router.register(r'attendance', views.AttendanceViewSet)
router.register(r'education', views.EducationViewSet)
router.register(r'health', views.HealthViewSet)
router.register(r'achievements', views.AchievementViewSet)
router.register(r'behaviour', views.BehaviourViewSet)
router.register(r'alerts', views.AlertViewSet)
router.register(r'expenses', views.ExpenseViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('children/<int:child_id>/development-score/', views.child_development_score_api, name='child_development_score_api'),
    path('education/recommendations/<int:child_id>/', views.learning_recommendations_api, name='learning_recommendations_api'),
    path('alerts/<int:alert_id>/resolve/', views.resolve_alert_api, name='resolve_alert_api'),
    path('volunteer/profile/', views.volunteer_profile_api, name='volunteer_profile_api'),
    path('volunteer/activities/', views.volunteer_activities_api, name='volunteer_activities_api'),
    path('volunteer/activities/<int:activity_id>/', views.volunteer_activity_detail_api, name='volunteer_activity_detail_api'),
    path('volunteer/activities/<int:activity_id>/status/', views.volunteer_activity_status_api, name='volunteer_activity_status_api'),
    path('predict/academic/', views.predict_academic, name='predict_academic'),
    path('predict/health/', views.predict_health, name='predict_health'),
    path('predict/behavior/', views.predict_behavior, name='predict_behavior'),
    path('predict/growth/', views.predict_growth, name='predict_growth'),
    path('dashboard/stats/', views.dashboard_stats_api, name='dashboard_stats'),
    path('predict/bulk-scan/', views.bulk_ai_scan_api, name='bulk_ai_scan'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/register/', views.register_view, name='register'),
    path('auth/google/', views.google_login_view, name='google_login'),
]
