"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from django.views.decorators.clickjacking import xframe_options_exempt

@xframe_options_exempt
def media_serve(request, path):
    response = serve(request, path, document_root=settings.MEDIA_ROOT)
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, OPTIONS, HEAD'
    response['Access-Control-Allow-Headers'] = '*'
    if 'X-Frame-Options' in response:
        del response['X-Frame-Options']
    return response

from django.http import HttpResponse

def root_home_view(request):
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Orphanage Management System - Backend Server</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #1e293b; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 2.5rem; max-width: 580px; width: 90%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); text-align: center; }
            .badge { display: inline-block; background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); padding: 0.35rem 0.85rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; margin-bottom: 1.25rem; }
            h1 { font-size: 1.5rem; margin: 0 0 0.5rem 0; font-weight: 700; }
            p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 2rem; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: background 0.2s; margin: 0.35rem; }
            .btn:hover { background: #2563eb; }
            .btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; }
            .btn-outline:hover { background: #334155; }
        </style>
    </head>
    <body>
        <div class="card">
            <span class="badge">&#x2714; Django Backend API is Active</span>
            <h1>Orphanage Management Backend</h1>
            <p>You have opened the Django Backend server (Port 8000). The React Web Application interface runs on <strong>Port 5173</strong>.</p>
            <div>
                <a href="http://localhost:5173" class="btn">&#x1F680; Open Web App (Port 5173)</a>
                <a href="/api/" class="btn btn-outline">&#x1F50C; Browse API Endpoints</a>
                <a href="/admin/" class="btn btn-outline">&#x1F6E1; Admin Portal</a>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)

urlpatterns = [
    path('', root_home_view, name='root_home'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    re_path(r'^media/(?P<path>.*)$', media_serve),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


