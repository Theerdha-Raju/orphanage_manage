# start.ps1
# This script starts both the Django backend and the React frontend.

Write-Host "Starting Django Backend Server on port 8000..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd backend; python manage.py runserver 0.0.0.0:8000" -WindowStyle Normal

Write-Host "Starting React Frontend Server on port 5173..." -ForegroundColor Cyan
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd frontend-react; npm run dev" -WindowStyle Normal

Write-Host "Both servers are starting. Please check the new terminal windows." -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend API: http://localhost:8000"
Write-Host "Django Admin: http://localhost:8000/admin/"
